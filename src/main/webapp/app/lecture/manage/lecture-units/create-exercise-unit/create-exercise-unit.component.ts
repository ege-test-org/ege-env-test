import { Component, Input, OnInit, inject, input, output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ExerciseUnit } from 'app/entities/lecture-unit/exerciseUnit.model';
import { CourseManagementService } from 'app/course/manage/course-management.service';
import { HttpErrorResponse } from '@angular/common/http';
import { onError } from 'app/shared/util/global.utils';
import { AlertService } from 'app/shared/service/alert.service';
import { concatMap, finalize, switchMap, take } from 'rxjs/operators';
import { Exercise } from 'app/entities/exercise.model';
import { SortService } from 'app/shared/service/sort.service';
import { combineLatest, forkJoin, from } from 'rxjs';
import { ExerciseUnitService } from 'app/lecture/manage/lecture-units/exerciseUnit.service';
import { faSort, faTimes } from '@fortawesome/free-solid-svg-icons';
import { TranslateDirective } from 'app/shared/language/translate.directive';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { SortDirective } from 'app/shared/sort/sort.directive';
import { SortByDirective } from 'app/shared/sort/sort-by.directive';

@Component({
    selector: 'jhi-create-exercise-unit',
    templateUrl: './create-exercise-unit.component.html',
    styleUrls: ['./create-exercise-unit.component.scss'],
    imports: [TranslateDirective, FaIconComponent, SortDirective, SortByDirective],
})
export class CreateExerciseUnitComponent implements OnInit {
    private activatedRoute = inject(ActivatedRoute);
    private router = inject(Router);
    private courseManagementService = inject(CourseManagementService);
    private alertService = inject(AlertService);
    private sortService = inject(SortService);
    private exerciseUnitService = inject(ExerciseUnitService);

    protected readonly faTimes = faTimes;
    protected readonly faSort = faSort;

    @Input() lectureId: number | undefined;
    @Input() courseId: number | undefined;
    hasCancelButton = input<boolean>();
    shouldNavigateOnSubmit = input<boolean>(true);

    onCancel = output<void>();
    onExerciseUnitCreated = output<void>();

    predicate = 'type';
    reverse = false;
    isLoading = false;

    exercisesAvailableForUnitCreation: Exercise[] = [];
    exercisesToCreateUnitFor: Exercise[] = [];

    ngOnInit(): void {
        this.isLoading = true;
        const lectureRoute = this.activatedRoute.parent!.parent!;
        combineLatest([lectureRoute.paramMap, lectureRoute.parent!.paramMap])
            .pipe(
                take(1),
                switchMap(([params, parentParams]) => {
                    this.lectureId ??= Number(params.get('lectureId'));
                    this.courseId ??= Number(parentParams.get('courseId'));

                    const courseObservable = this.courseManagementService.findWithExercises(this.courseId);
                    const exerciseUnitObservable = this.exerciseUnitService.findAllByLectureId(this.lectureId);
                    return forkJoin([courseObservable, exerciseUnitObservable]);
                }),
                finalize(() => {
                    this.isLoading = false;
                }),
            )
            .subscribe({
                next: ([courseResult, exerciseUnitResult]) => {
                    const allExercisesOfCourse = courseResult?.body?.exercises ? courseResult?.body?.exercises : [];
                    const idsOfExercisesAlreadyConnectedToUnit = exerciseUnitResult?.body
                        ? exerciseUnitResult?.body?.map((exerciseUnit: ExerciseUnit) => exerciseUnit.exercise?.id)
                        : [];
                    this.exercisesAvailableForUnitCreation = allExercisesOfCourse.filter((exercise: Exercise) => !idsOfExercisesAlreadyConnectedToUnit.includes(exercise.id));
                },
                error: (res: HttpErrorResponse) => onError(this.alertService, res),
            });
    }

    createExerciseUnits() {
        const exerciseUnitsToCreate = this.exercisesToCreateUnitFor.map((exercise: Exercise) => {
            const unit = new ExerciseUnit();
            unit.exercise = exercise;
            return unit;
        });

        from(exerciseUnitsToCreate)
            .pipe(
                concatMap((unit) => this.exerciseUnitService.create(unit, this.lectureId!)),
                finalize(() => {
                    if (this.shouldNavigateOnSubmit()) {
                        this.router.navigate(['../../'], { relativeTo: this.activatedRoute });
                    } else {
                        this.onExerciseUnitCreated.emit();
                    }
                }),
            )
            .subscribe({
                error: (res: HttpErrorResponse) => onError(this.alertService, res),
            });
    }

    sortRows() {
        this.sortService.sortByProperty(this.exercisesAvailableForUnitCreation, this.predicate, this.reverse);
    }

    selectExerciseForUnitCreation(exercise: Exercise) {
        if (this.isExerciseSelectedForUnitCreation(exercise)) {
            this.exercisesToCreateUnitFor.forEach((selectedExercise, index) => {
                if (selectedExercise === exercise) {
                    this.exercisesToCreateUnitFor.splice(index, 1);
                }
            });
        } else {
            this.exercisesToCreateUnitFor.push(exercise);
        }
    }

    isExerciseSelectedForUnitCreation(exercise: Exercise) {
        return this.exercisesToCreateUnitFor.includes(exercise);
    }

    cancelForm() {
        this.onCancel.emit();
    }
}
