import { ComponentFixture, TestBed } from '@angular/core/testing';
import dayjs from 'dayjs/esm';
import { Exercise, ExerciseType } from 'app/entities/exercise.model';
import { Submission } from 'app/entities/submission.model';
import { StudentParticipation } from 'app/entities/participation/student-participation.model';
import { ExamBarComponent } from 'app/exam/overview/exam-bar/exam-bar.component';
import { MockResizeObserver } from '../../../helpers/mocks/service/mock-resize-observer';
import { Exam } from 'app/entities/exam/exam.model';
import { StudentExam } from 'app/entities/student-exam.model';
import { LocalStorageService, SessionStorageService } from 'ngx-webstorage';
import { MockSyncStorage } from '../../../helpers/mocks/service/mock-sync-storage.service';
import { MockProvider } from 'ng-mocks';
import { AlertService } from 'app/shared/service/alert.service';
import { MockTranslateService } from '../../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';

describe('ExamBarComponent', () => {
    let fixture: ComponentFixture<ExamBarComponent>;
    let comp: ExamBarComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: LocalStorageService, useClass: MockSyncStorage },
                { provide: SessionStorageService, useClass: MockSyncStorage },
                { provide: TranslateService, useClass: MockTranslateService },
                MockProvider(AlertService),
                provideHttpClient(),
            ],
        }).compileComponents();
        // Required because exam bar uses the ResizeObserver for height calculations
        global.ResizeObserver = jest.fn().mockImplementation((callback: ResizeObserverCallback) => {
            return new MockResizeObserver(callback);
        });

        fixture = TestBed.createComponent(ExamBarComponent);
        comp = fixture.componentInstance;

        comp.exam = new Exam();
        comp.exam.title = 'Test Exam';
        comp.studentExam = new StudentExam();
        comp.endDate = dayjs();
        const exercises = [
            {
                id: 0,
                type: ExerciseType.PROGRAMMING,
                studentParticipations: [
                    {
                        submissions: [{ id: 3, isSynced: true } as Submission],
                    } as StudentParticipation,
                ],
            } as Exercise,
            { id: 1, type: ExerciseType.TEXT } as Exercise,
            { id: 2, type: ExerciseType.MODELING } as Exercise,
        ];
        comp.studentExam.exercises = exercises;
    });

    beforeEach(() => {
        fixture.detectChanges();
    });

    it('trigger emit and call saveExercise when the exam is about to end', () => {
        jest.spyOn(comp, 'saveExercise');
        jest.spyOn(comp.examAboutToEnd, 'emit');

        comp.triggerExamAboutToEnd();

        expect(comp.saveExercise).toHaveBeenCalledOnce();
        expect(comp.examAboutToEnd.emit).toHaveBeenCalledOnce();
    });

    it('should hand in the exam early', () => {
        jest.spyOn(comp.onExamHandInEarly, 'emit');
        jest.spyOn(comp, 'saveExercise');

        comp.handInEarly();
        expect(comp.onExamHandInEarly.emit).toHaveBeenCalledOnce();
    });
});
