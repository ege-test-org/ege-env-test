import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { CancellationModalComponent } from 'app/tutorialgroup/manage/tutorial-group-sessions/tutorial-group-sessions-management/cancellation-modal/cancellation-modal.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TutorialGroupSessionService } from 'app/tutorialgroup/shared/services/tutorial-group-session.service';
import { generateExampleTutorialGroupSession } from '../../../helpers/tutorialGroupSessionExampleModels';
import { TutorialGroupSession, TutorialGroupSessionStatus } from 'app/entities/tutorial-group/tutorial-group-session.model';
import { of } from 'rxjs';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { Course } from 'app/entities/course.model';
import { runOnPushChangeDetection } from '../../../../../helpers/on-push-change-detection.helper';
import { MockProvider } from 'ng-mocks';
import { MockTranslateService } from '../../../../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';

describe('CancellationModalComponent', () => {
    let fixture: ComponentFixture<CancellationModalComponent>;
    let component: CancellationModalComponent;
    const course = { id: 1, timeZone: 'Europe/Berlin' } as Course;
    const tutorialGroupId = 2;
    const tutorialGroupSessionId = 3;
    const tutorialGroupSession = generateExampleTutorialGroupSession({ id: tutorialGroupSessionId });
    let tutorialGroupSessionService: TutorialGroupSessionService;
    let modal: NgbActiveModal;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [MockProvider(NgbActiveModal), { provide: TranslateService, useClass: MockTranslateService }, provideHttpClient()],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(CancellationModalComponent);
                component = fixture.componentInstance;
                component.course = course;
                component.tutorialGroupId = tutorialGroupId;
                component.tutorialGroupSession = tutorialGroupSession;

                tutorialGroupSessionService = TestBed.inject(TutorialGroupSessionService);
                modal = TestBed.inject(NgbActiveModal);

                fixture.detectChanges();
            });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should initialize', () => {
        expect(component).not.toBeNull();
    });

    it('should call cancel when the activate cancel button is clicked with a active session', fakeAsync(() => {
        const cancelSessionSpy = jest.spyOn(tutorialGroupSessionService, 'cancel').mockReturnValue(of(new HttpResponse<TutorialGroupSession>({ body: tutorialGroupSession })));
        const closeModalSpy = jest.spyOn(modal, 'close');

        component!.reasonControl!.setValue('National Holiday');
        runOnPushChangeDetection(fixture);
        const button = fixture.debugElement.nativeElement.querySelector('#cancel-activate-button');
        button.click();

        fixture.whenStable().then(() => {
            expect(cancelSessionSpy).toHaveBeenCalledOnce();
            expect(cancelSessionSpy).toHaveBeenCalledWith(course.id, tutorialGroupId, tutorialGroupSessionId, 'National Holiday');
            expect(closeModalSpy).toHaveBeenCalledOnce();
            expect(closeModalSpy).toHaveBeenCalledWith('confirmed');
        });
    }));

    it('should call activate when the activate cancel button is clicked with a cancelled session', fakeAsync(() => {
        const activateSesssionSpy = jest.spyOn(tutorialGroupSessionService, 'activate').mockReturnValue(of(new HttpResponse<TutorialGroupSession>({ body: tutorialGroupSession })));
        const closeModalSpy = jest.spyOn(modal, 'close');

        component!.reasonControl!.setValue('National Holiday');
        runOnPushChangeDetection(fixture);
        component.tutorialGroupSession.status = TutorialGroupSessionStatus.CANCELLED;
        // click button with id cancel-activate-button
        const button = fixture.debugElement.nativeElement.querySelector('#cancel-activate-button');
        button.click();

        fixture.whenStable().then(() => {
            expect(activateSesssionSpy).toHaveBeenCalledOnce();
            expect(activateSesssionSpy).toHaveBeenCalledWith(course.id, tutorialGroupId, tutorialGroupSessionId);
            expect(closeModalSpy).toHaveBeenCalledOnce();
            expect(closeModalSpy).toHaveBeenCalledWith('confirmed');
        });
    }));
});
