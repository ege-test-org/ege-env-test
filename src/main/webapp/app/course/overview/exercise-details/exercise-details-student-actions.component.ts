import { Component, EventEmitter, HostBinding, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertService } from 'app/shared/service/alert.service';
import { ExternalCloningService } from 'app/programming/service/external-cloning.service';
import { FeatureToggle } from 'app/shared/feature-toggle/feature-toggle.service';
import { InitializationState } from 'app/entities/participation/participation.model';
import { Exercise, ExerciseType } from 'app/entities/exercise.model';
import { hasExerciseDueDatePassed, isResumeExerciseAvailable, isStartExerciseAvailable, isStartPracticeAvailable } from 'app/exercise/exercise.utils';
import { ProgrammingExerciseStudentParticipation } from 'app/entities/participation/programming-exercise-student-participation.model';
import { ProgrammingExercise } from 'app/entities/programming/programming-exercise.model';
import { StudentParticipation } from 'app/entities/participation/student-participation.model';
import { ArtemisQuizService } from 'app/shared/quiz/quiz.service';
import { finalize } from 'rxjs/operators';
import { faDesktop, faEye, faFolderOpen, faPlayCircle, faRedo, faUsers } from '@fortawesome/free-solid-svg-icons';
import { ParticipationService } from 'app/exercise/participation/participation.service';
import dayjs from 'dayjs/esm';
import { QuizExercise } from 'app/entities/quiz/quiz-exercise.model';
import { ProfileService } from 'app/shared/layouts/profiles/profile.service';
import { PROFILE_ATHENA, PROFILE_LOCALVC, PROFILE_THEIA } from 'app/app.constants';
import { AssessmentType } from 'app/entities/assessment-type.model';
import { ButtonType } from 'app/shared/components/button.component';
import { NgTemplateOutlet } from '@angular/common';
import { ExerciseActionButtonComponent } from 'app/shared/components/exercise-action-button.component';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FeatureToggleDirective } from 'app/shared/feature-toggle/feature-toggle.directive';
import { StartPracticeModeButtonComponent } from 'app/shared/components/start-practice-mode-button/start-practice-mode-button.component';
import { OpenCodeEditorButtonComponent } from 'app/shared/components/open-code-editor-button/open-code-editor-button.component';
import { CodeButtonComponent } from 'app/shared/components/code-button/code-button.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TranslateDirective } from 'app/shared/language/translate.directive';
import { RequestFeedbackButtonComponent } from './request-feedback-button/request-feedback-button.component';
import { ArtemisTranslatePipe } from 'app/shared/pipes/artemis-translate.pipe';
import { CourseExerciseService } from 'app/exercise/course-exercises/course-exercise.service';

@Component({
    imports: [
        NgTemplateOutlet,
        ExerciseActionButtonComponent,
        RouterLink,
        NgbTooltip,
        FeatureToggleDirective,
        StartPracticeModeButtonComponent,
        // TODO: the extension point for Orion does not work with Angular 19, we need to find a different solution
        // ExtensionPointDirective,
        OpenCodeEditorButtonComponent,
        CodeButtonComponent,
        FaIconComponent,
        TranslateDirective,
        RequestFeedbackButtonComponent,
        ArtemisTranslatePipe,
    ],
    providers: [ExternalCloningService],
    selector: 'jhi-exercise-details-student-actions',
    styleUrls: ['../course-overview.scss'],
    templateUrl: './exercise-details-student-actions.component.html',
})
export class ExerciseDetailsStudentActionsComponent implements OnInit, OnChanges {
    private alertService = inject(AlertService);
    private courseExerciseService = inject(CourseExerciseService);
    private participationService = inject(ParticipationService);
    private profileService = inject(ProfileService);

    readonly FeatureToggle = FeatureToggle;
    readonly ExerciseType = ExerciseType;
    readonly InitializationState = InitializationState;
    protected readonly ButtonType = ButtonType;

    @Input() @HostBinding('class.col') equalColumns = true;
    @Input() @HostBinding('class.col-auto') smallColumns = false;

    @Input() exercise: Exercise;
    @Input() courseId: number;
    @Input() smallButtons: boolean;
    @Input() examMode: boolean;
    @Input() isGeneratingFeedback: boolean;

    @Output() generatingFeedback: EventEmitter<void> = new EventEmitter<void>();

    // extension points, see shared/extension-point
    // TODO: the extension point for Orion does not work with Angular 19, we need to find a different solution
    // @ContentChild('overrideCodeAndOnlineEditorButton') overrideCodeAndOnlineEditorButton: TemplateRef<any>;

    uninitializedQuiz: boolean;
    quizNotStarted: boolean;
    gradedParticipation?: StudentParticipation;
    practiceParticipation?: StudentParticipation;
    programmingExercise?: ProgrammingExercise;
    isTeamAvailable: boolean;
    hasRatedGradedResult: boolean;
    beforeDueDate: boolean;
    editorLabel?: string;
    localVCEnabled = true;
    athenaEnabled = false;
    routerLink: string;

    theiaEnabled = false;
    theiaPortalURL: string;

    // Icons
    readonly faFolderOpen = faFolderOpen;
    readonly faUsers = faUsers;
    readonly faEye = faEye;
    readonly faPlayCircle = faPlayCircle;
    readonly faRedo = faRedo;
    readonly faDesktop = faDesktop;

    ngOnInit(): void {
        if (this.exercise.type === ExerciseType.QUIZ) {
            const quizExercise = this.exercise as QuizExercise;
            this.uninitializedQuiz = ArtemisQuizService.isUninitialized(quizExercise);
            this.quizNotStarted = ArtemisQuizService.notStarted(quizExercise);
        } else if (this.exercise.type === ExerciseType.PROGRAMMING) {
            this.programmingExercise = this.exercise as ProgrammingExercise;
            this.profileService.getProfileInfo().subscribe((profileInfo) => {
                this.localVCEnabled = profileInfo.activeProfiles?.includes(PROFILE_LOCALVC);
                this.athenaEnabled = profileInfo.activeProfiles?.includes(PROFILE_ATHENA);

                // The online IDE is only available with correct SpringProfile and if it's enabled for this exercise
                if (profileInfo.activeProfiles?.includes(PROFILE_THEIA) && this.programmingExercise) {
                    this.theiaEnabled = true;

                    // Set variables now, sanitize later on
                    this.theiaPortalURL = profileInfo.theiaPortalURL ?? '';

                    // Verify that Theia's portal URL is set
                    if (this.theiaPortalURL === '') {
                        this.theiaEnabled = false;
                    }

                    // Verify that the exercise allows the online IDE
                    if (!this.programmingExercise.allowOnlineIde) {
                        this.theiaEnabled = false;
                    }

                    // Verify that the exercise has a theia blueprint configured
                    if (!this.programmingExercise.buildConfig?.theiaImage) {
                        this.theiaEnabled = false;
                    }
                }
            });
        } else if (this.exercise.type === ExerciseType.MODELING) {
            this.editorLabel = 'openModelingEditor';
            this.profileService.getProfileInfo().subscribe((profileInfo) => {
                this.athenaEnabled = profileInfo.activeProfiles?.includes(PROFILE_ATHENA);
            });
        } else if (this.exercise.type === ExerciseType.TEXT) {
            this.editorLabel = 'openTextEditor';
            this.profileService.getProfileInfo().subscribe((profileInfo) => {
                this.athenaEnabled = profileInfo.activeProfiles?.includes(PROFILE_ATHENA);
            });
        } else if (this.exercise.type === ExerciseType.FILE_UPLOAD) {
            this.editorLabel = 'uploadFile';
        }

        this.beforeDueDate = !this.exercise.dueDate || !hasExerciseDueDatePassed(this.exercise, this.gradedParticipation);
    }

    /**
     * Viewing the team is only possible if it's a team exercise and the student is already assigned to a team.
     */
    ngOnChanges() {
        this.updateParticipations();
        this.isTeamAvailable = !!(this.exercise.teamMode && this.exercise.studentAssignedTeamIdComputed && this.exercise.studentAssignedTeamId);
    }

    startOnlineIDE() {
        window.open(this.theiaPortalURL, '_blank');
    }

    receiveNewParticipation(newParticipation: StudentParticipation) {
        const studentParticipations = this.exercise.studentParticipations ?? [];
        if (studentParticipations.map((participation) => participation.id).includes(newParticipation.id)) {
            this.exercise.studentParticipations = studentParticipations.map((participation) => (participation.id === newParticipation.id ? newParticipation : participation));
        } else {
            this.exercise.studentParticipations = [...studentParticipations, newParticipation];
        }
        this.updateParticipations();
    }

    updateParticipations() {
        const studentParticipations = this.exercise.studentParticipations ?? [];
        this.gradedParticipation = this.participationService.getSpecificStudentParticipation(studentParticipations, false);
        this.practiceParticipation = this.participationService.getSpecificStudentParticipation(studentParticipations, true);

        this.hasRatedGradedResult = !!this.gradedParticipation?.results?.some((result) => result.rated === true && result.assessmentType !== AssessmentType.AUTOMATIC_ATHENA);
    }

    /**
     * Starting an exercise is not possible in the exam or if it's a team exercise and the student is not yet assigned a team, otherwise see exercise.utils ->
     * isStartExerciseAvailable
     */
    isStartExerciseAvailable(): boolean {
        const individualExerciseOrTeamAssigned = !!(!this.exercise.teamMode || this.exercise.studentAssignedTeamId);
        return !this.examMode && individualExerciseOrTeamAssigned && isStartExerciseAvailable(this.exercise, this.gradedParticipation);
    }

    /**
     * Resuming an exercise is not possible in the exam, otherwise see exercise.utils -> isResumeExerciseAvailable
     */
    isResumeExerciseAvailable(participation?: StudentParticipation): boolean {
        return !this.examMode && isResumeExerciseAvailable(this.exercise, participation);
    }

    /**
     * Practicing an exercise is not possible in the exam, otherwise see exercise.utils -> isStartPracticeAvailable
     */
    isStartPracticeAvailable(): boolean {
        return !this.examMode && isStartPracticeAvailable(this.exercise, this.practiceParticipation);
    }

    startExercise() {
        this.exercise.loading = true;
        this.courseExerciseService
            .startExercise(this.exercise.id!)
            .pipe(finalize(() => (this.exercise.loading = false)))
            .subscribe({
                next: (participation) => {
                    if (participation) {
                        this.receiveNewParticipation(participation);
                    }
                    if (this.programmingExercise) {
                        if (participation?.initializationState === InitializationState.INITIALIZED) {
                            if (this.programmingExercise.allowOfflineIde) {
                                this.alertService.success('artemisApp.exercise.personalRepositoryClone');
                            } else {
                                this.alertService.success('artemisApp.exercise.personalRepositoryOnline');
                            }
                        } else {
                            this.alertService.error('artemisApp.exercise.startError');
                        }
                    }
                },
                error: () => {
                    this.alertService.error('artemisApp.exercise.startError');
                },
            });
    }

    /**
     * resume the programming exercise
     */
    resumeProgrammingExercise(testRun: boolean) {
        this.exercise.loading = true;
        const participation = testRun ? this.practiceParticipation : this.gradedParticipation;
        this.courseExerciseService
            .resumeProgrammingExercise(this.exercise.id!, participation!.id!)
            .pipe(finalize(() => (this.exercise.loading = false)))
            .subscribe({
                next: (resumedParticipation: StudentParticipation) => {
                    if (resumedParticipation) {
                        // Otherwise the client would think that all results are loaded, but there would not be any (=> no graded result).
                        resumedParticipation.results = participation ? participation.results : [];
                        const replacedIndex = this.exercise.studentParticipations!.indexOf(participation!);
                        this.exercise.studentParticipations![replacedIndex] = resumedParticipation;
                        this.updateParticipations();
                        this.alertService.success('artemisApp.exercise.resumeProgrammingExercise');
                    }
                },
                error: (error) => {
                    this.alertService.error(`artemisApp.${error.error.entityName}.errors.${error.error.errorKey}`);
                },
            });
    }

    get isBeforeStartDateAndStudent(): boolean {
        return !this.exercise.isAtLeastTutor && !!this.exercise.startDate && dayjs().isBefore(this.exercise.startDate);
    }

    /**
     * Display the 'open code editor' or 'code' buttons if
     * - the participation is initialized (build plan exists, this is always the case during an exam), or
     * - the participation is inactive (build plan cleaned up), but can not be resumed (e.g. because we're after the due date)
     *
     * for all conditions it is important that the repository is set
     *
     * For course exercises, an initialized practice participation should only be displayed if it's not possible to start a new graded participation.
     * For exam exercises, only one active participation can exist, so this should be shown.
     */
    public shouldDisplayIDEButtons(): boolean {
        if (!this.isRepositoryUriSet()) {
            return false;
        }
        const shouldPreferPractice = this.participationService.shouldPreferPractice(this.exercise);
        const activePracticeParticipation = this.practiceParticipation?.initializationState === InitializationState.INITIALIZED && (shouldPreferPractice || this.examMode);
        const activeGradedParticipation = this.gradedParticipation?.initializationState === InitializationState.INITIALIZED;
        const inactiveGradedParticipation =
            !!this.gradedParticipation?.initializationState &&
            [InitializationState.INACTIVE, InitializationState.FINISHED].includes(this.gradedParticipation.initializationState) &&
            !isStartExerciseAvailable(this.exercise, this.gradedParticipation);

        return activePracticeParticipation || activeGradedParticipation || inactiveGradedParticipation;
    }

    /**
     * Returns true if the repository uri of the active participation is set
     * We don't want to show buttons that would interact with the repository if the repository is not set
     */
    private isRepositoryUriSet(): boolean {
        const participations = this.exercise.studentParticipations ?? [];
        const activeParticipation: ProgrammingExerciseStudentParticipation = this.participationService.getSpecificStudentParticipation(participations, false) ?? participations[0];
        return !!activeParticipation?.repositoryUri;
    }

    /**
     * Returns the id of the team that the student is assigned to (only applicable to team-based exercises)
     *
     * @return {assignedTeamId}
     */
    get assignedTeamId(): number | undefined {
        const participations = this.exercise.studentParticipations;
        return participations?.length ? participations[0].team?.id : this.exercise.studentAssignedTeamId;
    }
}
