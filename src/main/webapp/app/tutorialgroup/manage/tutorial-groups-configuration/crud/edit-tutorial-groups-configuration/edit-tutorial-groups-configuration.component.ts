import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TutorialGroupsConfiguration } from 'app/entities/tutorial-group/tutorial-groups-configuration.model';
import { TutorialGroupsConfigurationFormData } from 'app/tutorialgroup/manage/tutorial-groups-configuration/crud/tutorial-groups-configuration-form/tutorial-groups-configuration-form.component';
import { AlertService } from 'app/shared/service/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { onError } from 'app/shared/util/global.utils';
import { Subject, combineLatest } from 'rxjs';
import { finalize, switchMap, take, takeUntil } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { Course } from 'app/entities/course.model';
import { CourseStorageService } from 'app/course/manage/course-storage.service';
import { LoadingIndicatorContainerComponent } from 'app/shared/loading-indicator-container/loading-indicator-container.component';
import { TranslateDirective } from 'app/shared/language/translate.directive';
import { TutorialGroupsConfigurationFormComponent } from '../tutorial-groups-configuration-form/tutorial-groups-configuration-form.component';
import { TutorialGroupsConfigurationService } from 'app/tutorialgroup/shared/services/tutorial-groups-configuration.service';

@Component({
    selector: 'jhi-edit-tutorial-groups-configuration',
    templateUrl: './edit-tutorial-groups-configuration.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LoadingIndicatorContainerComponent, TranslateDirective, TutorialGroupsConfigurationFormComponent],
})
export class EditTutorialGroupsConfigurationComponent implements OnInit, OnDestroy {
    private activatedRoute = inject(ActivatedRoute);
    private router = inject(Router);
    private tutorialGroupsConfigurationService = inject(TutorialGroupsConfigurationService);
    private courseStorageService = inject(CourseStorageService);
    private alertService = inject(AlertService);
    private cdr = inject(ChangeDetectorRef);

    ngUnsubscribe = new Subject<void>();

    isLoading = false;
    tutorialGroupsConfiguration: TutorialGroupsConfiguration;
    formData: TutorialGroupsConfigurationFormData;
    course: Course;
    tutorialGroupConfigurationId: number;

    ngOnInit(): void {
        this.isLoading = true;
        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data])
            .pipe(
                take(1),
                switchMap(([params, { course }]) => {
                    this.tutorialGroupConfigurationId = Number(params.get('tutorialGroupsConfigurationId'));
                    this.course = course;
                    return this.tutorialGroupsConfigurationService.getOneOfCourse(this.course.id!);
                }),
                finalize(() => (this.isLoading = false)),
                takeUntil(this.ngUnsubscribe),
            )
            .subscribe({
                next: (tutorialGroupsConfigurationResult) => {
                    if (tutorialGroupsConfigurationResult.body) {
                        this.tutorialGroupsConfiguration = tutorialGroupsConfigurationResult.body;
                        this.formData = {
                            period: [
                                this.tutorialGroupsConfiguration.tutorialPeriodStartInclusive!.toDate(),
                                this.tutorialGroupsConfiguration.tutorialPeriodEndInclusive!.toDate(),
                            ],
                            useTutorialGroupChannels: this.tutorialGroupsConfiguration.useTutorialGroupChannels,
                            usePublicTutorialGroupChannels: this.tutorialGroupsConfiguration.usePublicTutorialGroupChannels,
                        };
                    }
                },
                error: (res: HttpErrorResponse) => onError(this.alertService, res),
            })
            .add(() => this.cdr.detectChanges());
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    updateTutorialGroupsConfiguration(formData: TutorialGroupsConfigurationFormData) {
        const { period, useTutorialGroupChannels, usePublicTutorialGroupChannels } = formData;

        this.isLoading = true;
        this.tutorialGroupsConfiguration.useTutorialGroupChannels = useTutorialGroupChannels;
        this.tutorialGroupsConfiguration.usePublicTutorialGroupChannels = usePublicTutorialGroupChannels;
        this.tutorialGroupsConfigurationService
            .update(this.course.id!, this.tutorialGroupConfigurationId, this.tutorialGroupsConfiguration, period ?? [])
            .pipe(
                finalize(() => {
                    this.isLoading = false;
                    this.router.navigate(['/course-management', this.course.id!, 'tutorial-groups']);
                }),
                takeUntil(this.ngUnsubscribe),
            )
            .subscribe({
                next: (resp) => {
                    const updatedConfiguration = resp.body!;
                    this.course.tutorialGroupsConfiguration = updatedConfiguration;
                    this.courseStorageService.updateCourse(this.course);
                },
                error: (res: HttpErrorResponse) => onError(this.alertService, res),
            })
            .add(() => this.cdr.detectChanges());
    }
}
