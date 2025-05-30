import { Component, Injector, Input, OnInit, inject } from '@angular/core';
import { Exercise, ExerciseType } from 'app/entities/exercise.model';
import { ProgrammingExercise, ProgrammingLanguage } from 'app/entities/programming/programming-exercise.model';
import { FileUploadExercisePagingService } from 'app/fileupload/manage/file-upload-exercise-paging.service';
import { ModelingExercisePagingService } from 'app/modeling/manage/modeling-exercise-paging.service';
import { CodeAnalysisPagingService } from 'app/programming/manage/services/code-analysis-paging.service';
import { ProgrammingExercisePagingService } from 'app/programming/manage/services/programming-exercise-paging.service';
import { QuizExercisePagingService } from 'app/quiz/manage/quiz-exercise-paging.service';
import { ExercisePagingService } from 'app/exercise/manage/exercise-paging.service';
import { TextExercisePagingService } from 'app/text/manage/text-exercise/text-exercise-paging.service';
import { ImportComponent } from 'app/shared/import/import.component';
import { TranslateDirective } from 'app/shared/language/translate.directive';
import { FormsModule } from '@angular/forms';
import { SortDirective } from 'app/shared/sort/sort.directive';
import { SortByDirective } from 'app/shared/sort/sort-by.directive';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgbHighlight, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { ButtonComponent } from 'app/shared/components/button.component';
import { ExerciseCourseTitlePipe } from 'app/shared/pipes/exercise-course-title.pipe';

const DEFAULT_SORT_COLUMN = 'ID';

@Component({
    selector: 'jhi-exercise-import',
    templateUrl: './exercise-import.component.html',
    imports: [TranslateDirective, FormsModule, SortDirective, SortByDirective, FaIconComponent, NgbHighlight, ButtonComponent, NgbPagination, ExerciseCourseTitlePipe],
})
export class ExerciseImportComponent extends ImportComponent<Exercise> implements OnInit {
    private injector = inject(Injector);

    readonly ExerciseType = ExerciseType;

    @Input() exerciseType?: ExerciseType;

    /**
     * The programming language is only set when filtering for exercises with SCA enabled.
     * In this case we only want to display exercises with the given language
     */
    @Input()
    programmingLanguage?: ProgrammingLanguage;

    isCourseFilter = true;
    isExamFilter = true;

    titleKey: string;

    constructor() {
        // The exercise import component does not know yet which paging service to use
        // This gets determined based on the exercise type, which is not set when invoking the constructor
        // Therefore we temporally use this empty paging service which directly gets overwritten in ngOnInit().
        super(undefined);
    }

    ngOnInit(): void {
        if (!this.exerciseType) {
            return;
        }
        this.pagingService = this.getPagingService();
        if (this.programmingLanguage) {
            this.titleKey = 'artemisApp.programmingExercise.configureGrading.categories.importLabel';
        } else {
            this.titleKey =
                this.exerciseType === ExerciseType.FILE_UPLOAD ? `artemisApp.fileUploadExercise.home.importLabel` : `artemisApp.${this.exerciseType}Exercise.home.importLabel`;
        }

        super.ngOnInit();
    }

    private getPagingService(): ExercisePagingService<Exercise> {
        switch (this.exerciseType) {
            case ExerciseType.MODELING:
                return this.injector.get(ModelingExercisePagingService);
            case ExerciseType.PROGRAMMING:
                if (this.programmingLanguage) {
                    return this.injector.get(CodeAnalysisPagingService);
                }
                return this.injector.get(ProgrammingExercisePagingService);
            case ExerciseType.QUIZ:
                return this.injector.get(QuizExercisePagingService);
            case ExerciseType.TEXT:
                return this.injector.get(TextExercisePagingService);
            case ExerciseType.FILE_UPLOAD:
                return this.injector.get(FileUploadExercisePagingService);
            default:
                throw new Error('Unsupported exercise type: ' + this.exerciseType);
        }
    }

    protected createOptions(): object {
        return { isCourseFilter: this.isCourseFilter, isExamFilter: this.isExamFilter, programmingLanguage: this.programmingLanguage };
    }

    override set sortedColumn(sortedColumn: string) {
        if (sortedColumn === 'COURSE_TITLE') {
            if (this.isExamFilter && !this.isCourseFilter) {
                sortedColumn = 'EXAM_TITLE';
            }
            // sort by course / exam title is not possible if course and exam exercises are mixed
        }
        this.setSearchParam({ sortedColumn });
    }

    // When overriding the setter, we also need to override the getter.
    // Otherwise typescript will always return undefined when using the getter.
    override get sortedColumn(): string {
        return this.state.sortedColumn;
    }

    onCourseFilterChange() {
        this.isCourseFilter = !this.isCourseFilter;
        this.resetSortOnFilterChange();
        this.search.next();
    }

    onExamFilterChange() {
        this.isExamFilter = !this.isExamFilter;
        this.resetSortOnFilterChange();
        this.search.next();
    }

    // reset to default search option when mixing course and exam exercises.
    // This avoids exercises still being filtered out by the sortedColum even if the filter is not set.
    private resetSortOnFilterChange() {
        if (this.sortedColumn === 'COURSE_TITLE' || this.sortedColumn === 'EXAM_TITLE') {
            this.sortedColumn = DEFAULT_SORT_COLUMN;
        }
    }

    asProgrammingExercise(exercise: Exercise): ProgrammingExercise {
        return exercise as ProgrammingExercise;
    }
}
