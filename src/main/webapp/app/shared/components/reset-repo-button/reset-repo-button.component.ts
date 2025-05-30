import { Component, Input, OnInit, inject } from '@angular/core';
import { FeatureToggle } from 'app/shared/feature-toggle/feature-toggle.service';
import { faBackward } from '@fortawesome/free-solid-svg-icons';
import { ParticipationService } from 'app/exercise/participation/participation.service';
import { ProgrammingExercise } from 'app/entities/programming/programming-exercise.model';
import { StudentParticipation } from 'app/entities/participation/student-participation.model';
import { ProgrammingExerciseParticipationService } from 'app/programming/manage/services/programming-exercise-participation.service';
import { InitializationState } from 'app/entities/participation/participation.model';
import { getExerciseDueDate } from 'app/exercise/exercise.utils';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'app/shared/service/alert.service';
import dayjs from 'dayjs/esm';
import { ExerciseActionButtonComponent } from '../exercise-action-button.component';
import { FeatureToggleDirective } from '../../feature-toggle/feature-toggle.directive';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { TranslateDirective } from '../../language/translate.directive';
import { ConfirmEntityNameComponent } from '../../confirm-entity-name/confirm-entity-name.component';
import { ArtemisTranslatePipe } from '../../pipes/artemis-translate.pipe';

@Component({
    selector: 'jhi-reset-repo-button',
    templateUrl: './reset-repo-button.component.html',
    styleUrls: ['./reset-repo-button.component.scss'],
    imports: [ExerciseActionButtonComponent, FeatureToggleDirective, NgbPopover, FormsModule, TranslateDirective, ConfirmEntityNameComponent, ArtemisTranslatePipe],
})
export class ResetRepoButtonComponent implements OnInit {
    private participationService = inject(ParticipationService);
    private programmingExerciseParticipationService = inject(ProgrammingExerciseParticipationService);
    private alertService = inject(AlertService);

    readonly FeatureToggle = FeatureToggle;
    readonly INITIALIZED = InitializationState.INITIALIZED;

    @Input() exercise: ProgrammingExercise;
    @Input() participations: StudentParticipation[];
    @Input() smallButtons: boolean;

    gradedParticipation?: StudentParticipation;
    practiceParticipation?: StudentParticipation;

    beforeIndividualDueDate: boolean;

    readonly faBackward = faBackward;

    ngOnInit() {
        this.gradedParticipation = this.participationService.getSpecificStudentParticipation(this.participations, false);
        this.practiceParticipation = this.participationService.getSpecificStudentParticipation(this.participations, true);
        const individualDueDate = getExerciseDueDate(this.exercise, this.gradedParticipation);
        this.beforeIndividualDueDate = !individualDueDate || dayjs().isBefore(individualDueDate);
    }

    resetRepository(gradedParticipationId?: number) {
        this.exercise.loading = true;
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        const participationId = this.practiceParticipation?.id ?? this.gradedParticipation?.id!;
        this.programmingExerciseParticipationService
            .resetRepository(participationId, gradedParticipationId)
            .pipe(
                finalize(() => {
                    this.exercise.loading = false;
                    this.alertService.success('artemisApp.exerciseActions.resetRepository.success');
                    window.scrollTo(0, 0);
                }),
            )
            .subscribe();
    }
}
