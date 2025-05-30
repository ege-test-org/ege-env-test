import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { take } from 'rxjs/operators';
import { ComplaintResponseService } from 'app/assessment/manage/complaint-response.service';
import { ComplaintResponse } from 'app/entities/complaint-response.model';
import { Complaint } from 'app/entities/complaint.model';
import { AccountService } from 'app/core/auth/account.service';
import { MockProvider } from 'ng-mocks';
import dayjs from 'dayjs/esm';
import { User } from 'app/core/user/user.model';
import { TextExercise } from 'app/entities/text/text-exercise.model';
import { ComplaintAction, ComplaintResponseUpdateDTO } from 'app/entities/complaint-response-dto.model';

describe('ComplaintResponseService', () => {
    let complaintResponseService: ComplaintResponseService;
    let httpTestingController: HttpTestingController;
    let defaultComplaintResponse: ComplaintResponse;
    let complaintResponseResolve: ComplaintResponseUpdateDTO;
    let complaintResponseRefresh: ComplaintResponseUpdateDTO;
    let accountService: AccountService;
    let expectedComplaintResponse: any;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting(), MockProvider(AccountService)],
        })
            .compileComponents()
            .then(() => {
                expectedComplaintResponse = {} as HttpResponse<ComplaintResponse>;
                complaintResponseService = TestBed.inject(ComplaintResponseService);
                httpTestingController = TestBed.inject(HttpTestingController);
                accountService = TestBed.inject(AccountService);

                defaultComplaintResponse = new ComplaintResponse();
                defaultComplaintResponse.id = 1;
                defaultComplaintResponse.lockEndDate = dayjs();
                defaultComplaintResponse.submittedTime = dayjs();
                defaultComplaintResponse.complaint = new Complaint();
                defaultComplaintResponse.complaint.id = 1;

                complaintResponseResolve = new ComplaintResponseUpdateDTO();
                complaintResponseResolve.action = ComplaintAction.RESOLVE_COMPLAINT;
                complaintResponseResolve.responseText = 'response_text';
                complaintResponseResolve.complaintIsAccepted = true;
                complaintResponseRefresh = new ComplaintResponseUpdateDTO();
                complaintResponseRefresh.action = ComplaintAction.REFRESH_LOCK;
            });
    });

    afterEach(() => {
        httpTestingController.verify();
        jest.resetAllMocks();
    });

    function setupLockTest(loginOfLoggedInUser: string, loggedInUserIsInstructor: boolean, loginOfReviewer: string, lockActive: boolean) {
        jest.spyOn(accountService, 'userIdentity', 'get').mockImplementation(function getterFn() {
            const user = new User();
            user.login = loginOfLoggedInUser;
            return user;
        });
        jest.spyOn(accountService, 'isAtLeastInstructorForExercise').mockReturnValue(loggedInUserIsInstructor);

        const lockedComplaintResponse = new ComplaintResponse();
        lockedComplaintResponse.isCurrentlyLocked = lockActive;
        lockedComplaintResponse.submittedTime = undefined;
        const reviewer = new User();
        reviewer.login = loginOfReviewer;
        lockedComplaintResponse.reviewer = reviewer;
        return lockedComplaintResponse;
    }

    it.each([
        { user: 'test', instructor: false, reviewer: 'test2', lockActive: false, expected: false },
        { user: 'test', instructor: false, reviewer: 'test2', lockActive: true, expected: true },
        { user: 'test', instructor: true, reviewer: 'test2', lockActive: false, expected: false },
        { user: 'test', instructor: true, reviewer: 'test2', lockActive: true, expected: false },
        { user: 'test', instructor: false, reviewer: 'test', lockActive: true, expected: false },
        { user: 'test', instructor: false, reviewer: 'test', lockActive: false, expected: false },
        { user: 'test', instructor: true, reviewer: 'test', lockActive: false, expected: false },
    ])('should correctly calculate complaint lock status', ({ user, instructor, reviewer, lockActive, expected }) => {
        const lockedComplaintResponse = setupLockTest(user, instructor, reviewer, lockActive);
        const isLocked = complaintResponseService.isComplaintResponseLockedForLoggedInUser(lockedComplaintResponse, new TextExercise(undefined, undefined));
        expect(isLocked).toBe(expected);
    });

    it('should call refreshLock', async () => {
        const returnedFromService = { ...complaintResponseResolve };
        complaintResponseService
            .refreshLockOrResolveComplaint(complaintResponseResolve, 1)
            .pipe(take(1))
            .subscribe((resp) => (expectedComplaintResponse = resp));
        const req = httpTestingController.expectOne({ method: 'PATCH' });
        req.flush(returnedFromService);
        expect(expectedComplaintResponse.body).toEqual(complaintResponseResolve);
    });

    it('should call removeLock', async () => {
        const returnedFromService = {};
        complaintResponseService
            .removeLock(1)
            .pipe(take(1))
            .subscribe((resp) => (expectedComplaintResponse = resp));
        const req = httpTestingController.expectOne({ method: 'DELETE' });
        req.flush(returnedFromService);
    });

    it('should call createLock', async () => {
        const returnedFromService = { ...defaultComplaintResponse };
        complaintResponseService
            .createLock(1)
            .pipe(take(1))
            .subscribe((resp) => (expectedComplaintResponse = resp));
        const req = httpTestingController.expectOne({ method: 'POST' });
        req.flush(returnedFromService);
        expect(expectedComplaintResponse.body).toEqual(defaultComplaintResponse);
    });

    it('should call resolveComplaint', async () => {
        const returnedFromService = { ...complaintResponseRefresh };
        complaintResponseService
            .refreshLockOrResolveComplaint(complaintResponseResolve, 1)
            .pipe(take(1))
            .subscribe((resp) => (expectedComplaintResponse = resp));
        const req = httpTestingController.expectOne({ method: 'PATCH' });
        req.flush(returnedFromService);
        expect(expectedComplaintResponse.body).toEqual(complaintResponseRefresh);
    });
});
