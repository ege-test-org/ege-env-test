import { Component, Input, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertService } from 'app/shared/service/alert.service';
import { FeatureToggle } from 'app/shared/feature-toggle/feature-toggle.service';
import { ProgrammingExercise } from 'app/entities/programming/programming-exercise.model';
import { ButtonType } from 'app/shared/components/button.component';
import { faRedo } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from 'app/shared/components/button.component';
import { ProgrammingExerciseGradingService } from 'app/programming/manage/services/programming-exercise-grading.service';

/**
 * A button that re-evaluates all latest automatic results of the given programming exercise.
 */
@Component({
    selector: 'jhi-programming-exercise-re-evaluate-button',
    template: `
        <jhi-button
            id="re-evaluate-button"
            class="ms-3"
            [disabled]="disabled || isReEvaluationRunning"
            [btnType]="ButtonType.ERROR"
            [isLoading]="isReEvaluationRunning"
            [tooltip]="'artemisApp.programmingExercise.reEvaluateTooltip'"
            [icon]="faRedo"
            [title]="'artemisApp.programmingExercise.reEvaluate'"
            [featureToggle]="FeatureToggle.ProgrammingExercises"
            (onClick)="triggerReEvaluate()"
        />
    `,
    imports: [ButtonComponent],
})
export class ProgrammingExerciseReEvaluateButtonComponent {
    private testCaseService = inject(ProgrammingExerciseGradingService);
    private alertService = inject(AlertService);

    FeatureToggle = FeatureToggle;
    ButtonType = ButtonType;
    @Input() exercise: ProgrammingExercise;
    @Input() disabled = false;

    isReEvaluationRunning = false;

    // Icons
    faRedo = faRedo;

    /**
     * Triggers the re-evaluation of the programming exercise and displays the result in the end using an alert.
     */
    triggerReEvaluate() {
        this.isReEvaluationRunning = true;
        this.testCaseService.reEvaluate(this.exercise.id!).subscribe({
            next: (updatedResultsCount: number) => {
                this.isReEvaluationRunning = false;
                this.alertService.success(`artemisApp.programmingExercise.reEvaluateSuccessful`, { number: updatedResultsCount });
            },
            error: (error: HttpErrorResponse) => {
                this.isReEvaluationRunning = false;
                this.alertService.error(`artemisApp.programmingExercise.reEvaluateFailed`, { message: error.message });
            },
        });
    }
}
