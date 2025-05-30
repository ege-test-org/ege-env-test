import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseType } from 'app/entities/exercise.model';
import { of } from 'rxjs';
import { HttpHeaders, HttpResponse, provideHttpClient } from '@angular/common/http';
import { LocalStorageService, SessionStorageService } from 'ngx-webstorage';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TextExerciseComponent } from 'app/text/manage/text-exercise/text-exercise.component';
import { TextExercise } from 'app/entities/text/text-exercise.model';
import { MockSyncStorage } from '../../helpers/mocks/service/mock-sync-storage.service';
import { Course } from 'app/entities/course.model';
import { ExerciseFilter } from 'app/entities/exercise-filter.model';
import { MockNgbModalService } from '../../helpers/mocks/service/mock-ngb-modal.service';
import { CourseExerciseService } from 'app/exercise/course-exercises/course-exercise.service';
import { ExerciseImportWrapperComponent } from 'app/exercise/import/exercise-import-wrapper/exercise-import-wrapper.component';
import { MockProvider } from 'ng-mocks';
import { MockTranslateService } from '../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { MockAccountService } from '../../helpers/mocks/service/mock-account.service';
import { EventManager } from 'app/shared/service/event-manager.service';

describe('TextExercise Management Component', () => {
    let comp: TextExerciseComponent;
    let fixture: ComponentFixture<TextExerciseComponent>;
    let courseExerciseService: CourseExerciseService;
    let modalService: NgbModal;

    const course = { id: 123 } as Course;
    const textExercise: TextExercise = { id: 456, title: 'Text Exercise', type: 'text' } as TextExercise;
    const route = { snapshot: { paramMap: convertToParamMap({ courseId: course.id }) }, queryParams: of({}) } as any as ActivatedRoute;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: ActivatedRoute, useValue: route },
                { provide: LocalStorageService, useClass: MockSyncStorage },
                { provide: SessionStorageService, useClass: MockSyncStorage },
                { provide: NgbModal, useClass: MockNgbModalService },
                { provide: TranslateService, useClass: MockTranslateService },
                { provide: AccountService, useClass: MockAccountService },
                provideHttpClient(),
                MockProvider(EventManager),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(TextExerciseComponent);
        comp = fixture.componentInstance;
        courseExerciseService = fixture.debugElement.injector.get(CourseExerciseService);
        modalService = fixture.debugElement.injector.get(NgbModal);

        comp.textExercises = [textExercise];
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should call loadExercises on init', () => {
        // GIVEN
        const headers = new HttpHeaders().append('link', 'link;link');
        jest.spyOn(courseExerciseService, 'findAllTextExercisesForCourse').mockReturnValue(
            of(
                new HttpResponse({
                    body: [textExercise],
                    headers,
                }),
            ),
        );

        // WHEN
        comp.course = course;
        comp.ngOnInit();

        // THEN
        expect(courseExerciseService.findAllTextExercisesForCourse).toHaveBeenCalledOnce();
    });

    it('should open import modal', () => {
        const mockReturnValue = {
            result: Promise.resolve({ id: 456 } as TextExercise),
            componentInstance: {},
        } as NgbModalRef;
        jest.spyOn(modalService, 'open').mockReturnValue(mockReturnValue);

        comp.openImportModal();
        expect(modalService.open).toHaveBeenCalledWith(ExerciseImportWrapperComponent, { size: 'lg', backdrop: 'static' });
        expect(modalService.open).toHaveBeenCalledOnce();
        expect(mockReturnValue.componentInstance.exerciseType).toEqual(ExerciseType.TEXT);
    });

    it('should return exercise id', () => {
        expect(comp.trackId(0, textExercise)).toBe(456);
    });

    describe('TextExercise Search Exercises', () => {
        it('should show all exercises', () => {
            // WHEN
            comp.exerciseFilter = new ExerciseFilter('EXT', '', 'text');

            // THEN
            expect(comp.textExercises).toHaveLength(1);
            expect(comp.filteredTextExercises).toHaveLength(1);
        });

        it('should show no exercises', () => {
            // WHEN
            comp.exerciseFilter = new ExerciseFilter('Prog', '', 'all');

            // THEN
            expect(comp.textExercises).toHaveLength(1);
            expect(comp.filteredTextExercises).toHaveLength(0);
        });
    });

    it('should have working selection', () => {
        // WHEN
        comp.toggleExercise(textExercise);

        // THEN
        expect(comp.selectedExercises[0]).toContainEntry(['id', textExercise.id]);
        expect(comp.allChecked).toEqual(comp.selectedExercises.length === comp.textExercises.length);
    });
});
