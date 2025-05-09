import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { getCourseFromExercise } from 'app/entities/exercise.model';
import type { ProgrammingExercise, ProgrammingLanguage } from 'app/entities/programming/programming-exercise.model';
import { ProgrammingExerciseBuildConfig } from 'app/entities/programming/programming-exercise-build.config';
import { ProgrammingExerciseService } from 'app/programming/manage/services/programming-exercise.service';
import { Subscription } from 'rxjs';
import type { CheckoutDirectoriesDto } from 'app/entities/programming/checkout-directories-dto';

import { ProgrammingExerciseBuildPlanCheckoutDirectoriesComponent } from 'app/programming/shared/build-details/programming-exercise-build-plan-checkout-directories.component';
import { BuildPlanCheckoutDirectoriesDTO } from 'app/entities/programming/build-plan-checkout-directories-dto';
import { HelpIconComponent } from 'app/shared/components/help-icon.component';
import { CommonModule } from '@angular/common';
import { TranslateDirective } from 'app/shared/language/translate.directive';

@Component({
    selector: 'jhi-programming-exercise-repository-and-build-plan-details',
    templateUrl: './programming-exercise-repository-and-build-plan-details.component.html',
    styleUrls: ['../../manage/programming-exercise-form.scss'],
    imports: [ProgrammingExerciseBuildPlanCheckoutDirectoriesComponent, HelpIconComponent, CommonModule, TranslateDirective],
})
export class ProgrammingExerciseRepositoryAndBuildPlanDetailsComponent implements OnInit, OnChanges, OnDestroy {
    private programmingExerciseService = inject(ProgrammingExerciseService);

    @Input() programmingExercise: ProgrammingExercise;
    @Input() programmingExerciseBuildConfig?: ProgrammingExerciseBuildConfig;
    @Input() programmingLanguage?: ProgrammingLanguage;
    @Input() isLocal: boolean;
    @Input() checkoutSolutionRepository = true;
    @Input() isCreateOrEdit = false;
    @Input() isEditMode = false;
    @Output() submissionBuildPlanEvent = new EventEmitter<BuildPlanCheckoutDirectoriesDTO>();

    checkoutDirectorySubscription?: Subscription;

    courseShortName?: string;
    checkoutDirectories?: CheckoutDirectoriesDto;

    ngOnInit() {
        this.updateCourseShortName();

        if (this.isLocal) {
            this.updateCheckoutDirectories();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        const isProgrammingLanguageUpdated = changes.programmingLanguage?.currentValue !== changes.programmingLanguage?.previousValue;
        const isCheckoutSolutionRepositoryUpdated = changes.checkoutSolutionRepository?.currentValue !== changes.checkoutSolutionRepository?.previousValue;
        if (this.isLocal && (isProgrammingLanguageUpdated || isCheckoutSolutionRepositoryUpdated)) {
            if (this.isCreateOrEdit && !this.isEditMode) {
                this.resetProgrammingExerciseBuildCheckoutPaths();
            }
            this.updateCheckoutDirectories();
        }

        const isBuildConfigChanged = this.isBuildConfigAvailable(this.programmingExercise.buildConfig);
        if (this.isLocal && this.isCreateOrEdit && isBuildConfigChanged) {
            this.checkoutDirectories = this.setCheckoutDirectoriesFromBuildConfig(this.checkoutDirectories);
        }
    }

    ngOnDestroy() {
        this.checkoutDirectorySubscription?.unsubscribe();
    }

    private updateCheckoutDirectories() {
        if (!this.programmingLanguage) {
            return;
        }

        this.checkoutDirectorySubscription?.unsubscribe(); // might be defined from previous method execution

        const CHECKOUT_SOLUTION_REPOSITORY_DEFAULT = true;
        this.checkoutDirectorySubscription = this.programmingExerciseService
            .getCheckoutDirectoriesForProgrammingLanguage(this.programmingLanguage, this.checkoutSolutionRepository ?? CHECKOUT_SOLUTION_REPOSITORY_DEFAULT)
            .subscribe((checkoutDirectories) => {
                if ((this.isCreateOrEdit && !this.isEditMode) || !this.isBuildConfigAvailable(this.programmingExercise.buildConfig)) {
                    this.checkoutDirectories = checkoutDirectories;
                    this.submissionBuildPlanEvent.emit(checkoutDirectories.submissionBuildPlanCheckoutDirectories!);
                } else {
                    this.checkoutDirectories = this.setCheckoutDirectoriesFromBuildConfig(checkoutDirectories);
                }
            });
    }

    private setCheckoutDirectoriesFromBuildConfig(checkoutDirectories?: CheckoutDirectoriesDto): CheckoutDirectoriesDto | undefined {
        if (this.programmingExercise.buildConfig || checkoutDirectories) {
            checkoutDirectories = {
                solutionBuildPlanCheckoutDirectories: {
                    solutionCheckoutDirectory:
                        this.addLeadingSlash(this.programmingExercise.buildConfig?.assignmentCheckoutPath) ||
                        checkoutDirectories?.solutionBuildPlanCheckoutDirectories?.solutionCheckoutDirectory,
                    testCheckoutDirectory:
                        this.addLeadingSlash(this.programmingExercise.buildConfig?.testCheckoutPath) ||
                        checkoutDirectories?.solutionBuildPlanCheckoutDirectories?.testCheckoutDirectory ||
                        '/',
                },
                submissionBuildPlanCheckoutDirectories: {
                    exerciseCheckoutDirectory:
                        this.addLeadingSlash(this.programmingExercise.buildConfig?.assignmentCheckoutPath) ||
                        checkoutDirectories?.submissionBuildPlanCheckoutDirectories?.exerciseCheckoutDirectory,
                    solutionCheckoutDirectory:
                        this.addLeadingSlash(this.programmingExercise.buildConfig?.solutionCheckoutPath) ||
                        checkoutDirectories?.submissionBuildPlanCheckoutDirectories?.solutionCheckoutDirectory,
                    testCheckoutDirectory:
                        this.addLeadingSlash(this.programmingExercise.buildConfig?.testCheckoutPath) ||
                        checkoutDirectories?.submissionBuildPlanCheckoutDirectories?.testCheckoutDirectory ||
                        '/',
                },
            };
        }
        return checkoutDirectories;
    }

    private updateCourseShortName() {
        if (!this.programmingExercise) {
            return;
        }
        this.courseShortName = getCourseFromExercise(this.programmingExercise)?.shortName;
    }

    private addLeadingSlash(path?: string): string | undefined {
        if (!path) {
            return undefined;
        }
        return path.startsWith('/') ? path : `/${path}`;
    }

    private isBuildConfigAvailable(buildConfig?: ProgrammingExerciseBuildConfig): boolean {
        return (
            buildConfig !== undefined &&
            ((buildConfig.assignmentCheckoutPath !== undefined && buildConfig.assignmentCheckoutPath.trim() !== '') ||
                (buildConfig.testCheckoutPath !== undefined && buildConfig.testCheckoutPath.trim() !== '') ||
                (buildConfig.solutionCheckoutPath !== undefined && buildConfig.solutionCheckoutPath.trim() !== ''))
        );
    }

    private resetProgrammingExerciseBuildCheckoutPaths() {
        this.programmingExercise.buildConfig!.assignmentCheckoutPath = undefined;
        this.programmingExercise.buildConfig!.testCheckoutPath = undefined;
        this.programmingExercise.buildConfig!.solutionCheckoutPath = undefined;
    }
}
