import { Component, computed, inject, input, signal } from '@angular/core';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ImportTableComponent } from 'app/shared/import-list/import-table.component';
import { PagingService } from 'app/exercise/manage/paging.service';
import { Column } from 'app/shared/import/import.component';
import { Course } from 'app/entities/course.model';
import {
    CourseCompetencyImportSettings,
    ImportCourseCompetenciesSettingsComponent,
} from 'app/atlas/manage/import-course-competencies-settings/import-course-competencies-settings.component';
import { CourseCompetencyImportOptionsDTO } from 'app/entities/competency.model';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TranslateDirective } from 'app/shared/language/translate.directive';
import { CourseForImportDTOPagingService } from 'app/course/shared/course-for-import-dto-paging-service';

const tableColumns: Column<Course>[] = [
    {
        name: 'TITLE',
        getProperty: (entity: Course) => entity.title,
    },
    {
        name: 'SHORT_NAME',
        getProperty: (entity: Course) => entity.shortName,
    },
    {
        name: 'SEMESTER',
        getProperty: (entity: Course) => entity.semester,
    },
];

export interface ImportAllCourseCompetenciesResult {
    course: Course;
    courseCompetencyImportOptions: CourseCompetencyImportOptionsDTO;
}

@Component({
    selector: 'jhi-import-all-course-competencies-modal',
    imports: [ImportTableComponent, ImportCourseCompetenciesSettingsComponent, FaIconComponent, TranslateDirective],
    providers: [
        {
            provide: PagingService,
            useClass: CourseForImportDTOPagingService,
        },
    ],
    templateUrl: './import-all-course-competencies-modal.component.html',
})
export class ImportAllCourseCompetenciesModalComponent {
    protected readonly tableColumns = tableColumns;

    protected readonly closeIcon = faXmark;

    private readonly activeModal = inject(NgbActiveModal);

    readonly courseId = input.required<number>();
    readonly disabledIds = computed(() => [+this.courseId()]);

    importSettings = signal<CourseCompetencyImportSettings>(new CourseCompetencyImportSettings());

    public selectCourse(course: Course): void {
        const courseCompetencyImportOptions = <CourseCompetencyImportOptionsDTO>{
            sourceCourseId: course.id,
            ...this.importSettings(),
        };
        this.activeModal.close(<ImportAllCourseCompetenciesResult>{
            course,
            courseCompetencyImportOptions,
        });
    }

    protected closeModal(): void {
        this.activeModal.close();
    }
}
