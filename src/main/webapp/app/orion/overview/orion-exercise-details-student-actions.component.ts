import { Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FeatureToggle } from 'app/shared/feature-toggle/feature-toggle.service';
import { ProgrammingExercise } from 'app/entities/programming/programming-exercise.model';
import { ProgrammingExerciseStudentParticipation } from 'app/entities/participation/programming-exercise-student-participation.model';
import { ExerciseView, OrionState } from 'app/shared/orion/orion';
import { OrionConnectorService } from 'app/shared/orion/orion-connector.service';
import { OrionBuildAndTestService } from 'app/shared/orion/orion-build-and-test.service';
import { Exercise } from 'app/entities/exercise.model';
import { OrionButtonType } from 'app/shared/orion/orion-button/orion-button.component';
import { ExerciseDetailsStudentActionsComponent } from 'app/course/overview/exercise-details/exercise-details-student-actions.component';
import { OrionButtonComponent } from 'app/shared/orion/orion-button/orion-button.component';
import { ArtemisTranslatePipe } from 'app/shared/pipes/artemis-translate.pipe';

@Component({
    selector: 'jhi-orion-exercise-details-student-actions',
    templateUrl: './orion-exercise-details-student-actions.component.html',
    styleUrls: ['../../overview/course-overview.scss'],
    imports: [ExerciseDetailsStudentActionsComponent, OrionButtonComponent, ArtemisTranslatePipe],
})
export class OrionExerciseDetailsStudentActionsComponent implements OnInit {
    private orionConnectorService = inject(OrionConnectorService);
    private ideBuildAndTestService = inject(OrionBuildAndTestService);
    private route = inject(ActivatedRoute);

    readonly ExerciseView = ExerciseView;
    orionState: OrionState;
    FeatureToggle = FeatureToggle;

    @Input() exercise: Exercise;
    @Input() courseId: number;
    @Input() smallButtons: boolean;
    @Input() examMode: boolean;

    protected readonly OrionButtonType = OrionButtonType;

    /**
     * get orionState and submit changes if withIdeSubmit set in route query
     */
    ngOnInit(): void {
        if (this.orionConnectorService && this.orionConnectorService.state()) {
            this.orionConnectorService.state().subscribe((orionState: OrionState) => (this.orionState = orionState));
            this.route.queryParams.subscribe((params) => {
                if (params['withIdeSubmit']) {
                    this.submitChanges();
                }
            });
        }
    }

    get isOfflineIdeAllowed() {
        return (this.exercise as ProgrammingExercise).allowOfflineIde;
    }

    /**
     * Imports the current exercise in the user's IDE and triggers the opening of the new project in the IDE
     */
    importIntoIDE() {
        const repo = (this.exercise.studentParticipations![0] as ProgrammingExerciseStudentParticipation).repositoryUri!;
        this.orionConnectorService.importParticipation(repo, this.exercise as ProgrammingExercise);
    }

    /**
     * Submits the changes made in the IDE by staging everything, committing the changes and pushing them to master.
     */
    submitChanges() {
        this.orionConnectorService.submit();
        this.ideBuildAndTestService.listenOnBuildOutputAndForwardChanges(this.exercise as ProgrammingExercise);
    }

    /**
     * Initializes a test repository
     */
    initializeTestRepository() {
        this.orionConnectorService.initializeTestRepository(this.exercise as ProgrammingExercise);
    }

    /**
     * Returns if the dude date has passed
     */
    isDueDatePassed() {
        // Returns if the due date has passed
        if (this.exercise.dueDate === undefined) {
            return false;
        }
        return this.exercise.dueDate.date() < Date.now();
    }
}
