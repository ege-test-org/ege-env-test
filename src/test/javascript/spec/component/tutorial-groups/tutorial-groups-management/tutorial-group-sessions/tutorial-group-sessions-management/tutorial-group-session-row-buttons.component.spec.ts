import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { TutorialGroupSessionRowButtonsComponent } from 'app/tutorialgroup/manage/tutorial-group-sessions/tutorial-group-sessions-management/tutorial-group-session-row-buttons/tutorial-group-session-row-buttons.component';
import { TutorialGroupSessionService } from 'app/tutorialgroup/shared/services/tutorial-group-session.service';
import { TutorialGroupSession } from 'app/entities/tutorial-group/tutorial-group-session.model';
import { generateExampleTutorialGroupSession } from '../../../helpers/tutorialGroupSessionExampleModels';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MockNgbModalService } from '../../../../../helpers/mocks/service/mock-ngb-modal.service';
import { CancellationModalComponent } from 'app/tutorialgroup/manage/tutorial-group-sessions/tutorial-group-sessions-management/cancellation-modal/cancellation-modal.component';
import { Course } from 'app/entities/course.model';
import { TutorialGroup } from 'app/entities/tutorial-group/tutorial-group.model';
import { generateExampleTutorialGroup } from '../../../helpers/tutorialGroupExampleModels';
import { EditTutorialGroupSessionComponent } from 'app/tutorialgroup/manage/tutorial-group-sessions/crud/edit-tutorial-group-session/edit-tutorial-group-session.component';
import { MockTranslateService } from '../../../../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';
import { MockProvider } from 'ng-mocks';

describe('TutorialGroupSessionRowButtonsComponent', () => {
    let fixture: ComponentFixture<TutorialGroupSessionRowButtonsComponent>;
    let component: TutorialGroupSessionRowButtonsComponent;
    let sessionService: TutorialGroupSessionService;
    const course = { id: 1 } as Course;
    let tutorialGroup: TutorialGroup;
    let tutorialGroupSession: TutorialGroupSession;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: NgbModal, useClass: MockNgbModalService },
                { provide: TranslateService, useClass: MockTranslateService },
                MockProvider(TutorialGroupSessionService),
            ],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(TutorialGroupSessionRowButtonsComponent);
                component = fixture.componentInstance;
                sessionService = TestBed.inject(TutorialGroupSessionService);
                tutorialGroupSession = generateExampleTutorialGroupSession({});
                tutorialGroup = generateExampleTutorialGroup({});
                setInputValues();
                fixture.detectChanges();
            });
    });

    const setInputValues = () => {
        fixture.componentRef.setInput('course', course);
        fixture.componentRef.setInput('tutorialGroup', tutorialGroup);
        fixture.componentRef.setInput('tutorialGroupSession', tutorialGroupSession);
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should initialize', () => {
        expect(component).toBeTruthy();
    });

    it('should open the edit dialog when the respective button is clicked', fakeAsync(() => {
        const modalService = TestBed.inject(NgbModal);
        const mockModalRef = {
            componentInstance: { tutorialGroupSession: undefined, course: undefined, tutorialGroup: undefined, initialize: () => {} },
            result: of(),
        };
        const modalOpenSpy = jest.spyOn(modalService, 'open').mockReturnValue(mockModalRef as unknown as NgbModalRef);
        const openDialogSpy = jest.spyOn(component, 'openEditSessionDialog');

        const editButton = fixture.debugElement.nativeElement.querySelector('#edit-' + tutorialGroupSession.id);
        editButton.click();

        fixture.whenStable().then(() => {
            expect(openDialogSpy).toHaveBeenCalledOnce();
            expect(modalOpenSpy).toHaveBeenCalledOnce();
            expect(modalOpenSpy).toHaveBeenCalledWith(EditTutorialGroupSessionComponent, { backdrop: 'static', scrollable: false, size: 'lg', animation: false });
            expect(mockModalRef.componentInstance.tutorialGroupSession).toEqual(tutorialGroupSession);
            expect(mockModalRef.componentInstance.course).toEqual(course);
            expect(mockModalRef.componentInstance.tutorialGroup).toEqual(tutorialGroup);
        });
    }));

    it('should open the cancellation / activation dialog when the respective button is clicked', fakeAsync(() => {
        const modalService = TestBed.inject(NgbModal);
        const mockModalRef = {
            componentInstance: { tutorialGroupSession: undefined, course: undefined, tutorialGroupId: undefined },
            result: { then: () => Promise.resolve() },
        };
        const modalOpenSpy = jest.spyOn(modalService, 'open').mockReturnValue(mockModalRef as unknown as NgbModalRef);
        const openDialogSpy = jest.spyOn(component, 'openCancellationDialog');
        const cancelButton = fixture.debugElement.nativeElement.querySelector('#cancel-activate-' + tutorialGroupSession.id);
        cancelButton.click();

        fixture.whenStable().then(() => {
            expect(openDialogSpy).toHaveBeenCalledOnce();
            expect(openDialogSpy).toHaveBeenCalledWith(tutorialGroupSession);
            expect(modalOpenSpy).toHaveBeenCalledOnce();
            expect(modalOpenSpy).toHaveBeenCalledWith(CancellationModalComponent, { animation: false, backdrop: 'static', scrollable: false, size: 'lg' });
            expect(mockModalRef.componentInstance.tutorialGroupSession).toEqual(tutorialGroupSession);
            expect(mockModalRef.componentInstance.course).toEqual(course);
            expect(mockModalRef.componentInstance.tutorialGroupId).toEqual(tutorialGroup.id);
        });
    }));

    it('should call delete and emit deleted event', () => {
        const deleteSpy = jest.spyOn(sessionService, 'delete').mockReturnValue(of(new HttpResponse<void>({})));
        const deleteEventSpy = jest.spyOn(component.tutorialGroupSessionDeleted, 'emit');
        component.deleteTutorialGroupSession();
        expect(deleteSpy).toHaveBeenCalledWith(course.id, tutorialGroup.id!, tutorialGroupSession.id);
        expect(deleteEventSpy).toHaveBeenCalledOnce();
    });
});
