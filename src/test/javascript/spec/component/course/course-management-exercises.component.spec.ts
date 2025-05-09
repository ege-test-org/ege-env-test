import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { CourseExerciseCardComponent } from 'app/course/manage/course-exercise-card.component';
import { CourseManagementExercisesComponent } from 'app/course/manage/course-management-exercises.component';
import { CourseManagementService } from 'app/course/manage/course-management.service';
import { Course } from 'app/entities/course.model';
import { FileUploadExerciseComponent } from 'app/fileupload/manage/file-upload-exercise.component';
import { ModelingExerciseComponent } from 'app/modeling/manage/modeling-exercise.component';
import { ProgrammingExerciseComponent } from 'app/programming/manage/programming-exercise.component';
import { QuizExerciseComponent } from 'app/quiz/manage/quiz-exercise.component';
import { TextExerciseComponent } from 'app/text/manage/text-exercise/text-exercise.component';
import { OrionFilterDirective } from 'app/shared/orion/orion-filter.directive';
import { ArtemisTranslatePipe } from 'app/shared/pipes/artemis-translate.pipe';
import { MockComponent, MockDirective, MockPipe, MockProvider } from 'ng-mocks';
import { ExtensionPointDirective } from 'app/shared/extension-point/extension-point.directive';
import { TranslateDirective } from 'app/shared/language/translate.directive';
import { CourseManagementExercisesSearchComponent } from 'app/course/manage/course-management-exercises-search.component';
import { of } from 'rxjs';
import { DocumentationButtonComponent } from 'app/shared/components/documentation-button/documentation-button.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockTranslateService } from '../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';

describe('Course Management Exercises Component', () => {
    let comp: CourseManagementExercisesComponent;
    let fixture: ComponentFixture<CourseManagementExercisesComponent>;
    const course = new Course();
    course.id = 123;
    const parentRoute = {
        data: of({ course }),
    } as any as ActivatedRoute;
    const route = { parent: parentRoute, queryParams: of({}) } as any as ActivatedRoute;
    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                CourseManagementExercisesComponent,
                MockPipe(ArtemisTranslatePipe),
                MockComponent(CourseExerciseCardComponent),
                MockDirective(TranslateDirective),
                MockDirective(ExtensionPointDirective),
                MockComponent(ProgrammingExerciseComponent),
                MockDirective(OrionFilterDirective),
                MockComponent(QuizExerciseComponent),
                MockComponent(ModelingExerciseComponent),
                MockComponent(FileUploadExerciseComponent),
                MockComponent(TextExerciseComponent),
                MockComponent(CourseManagementExercisesSearchComponent),
                MockComponent(DocumentationButtonComponent),
            ],
            providers: [
                MockProvider(CourseManagementService),
                {
                    provide: ActivatedRoute,
                    useValue: route,
                },
                { provide: TranslateService, useClass: MockTranslateService },
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(CourseManagementExercisesComponent);
        comp = fixture.componentInstance;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should get course on onInit', () => {
        comp.ngOnInit();
        expect(comp.course).toBe(course);
    });

    it('should open search bar on button click', () => {
        fixture.detectChanges();
        const button = fixture.debugElement.nativeElement.querySelector('#toggleSearchButton');
        button.click();
        fixture.detectChanges();

        const searchBar = fixture.debugElement.nativeElement.querySelector('jhi-course-management-exercises-search');

        expect(comp.showSearch).toBeTrue();
        expect(searchBar).not.toBeNull();
    });
});
