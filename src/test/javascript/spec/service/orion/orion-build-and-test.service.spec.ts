import { ParticipationWebsocketService } from 'app/course/shared/participation-websocket.service';
import { TestBed } from '@angular/core/testing';
import { LocalStorageService, SessionStorageService } from 'ngx-webstorage';
import { Result } from 'app/entities/result.model';
import { BehaviorSubject, of } from 'rxjs';
import { Feedback, FeedbackType, STATIC_CODE_ANALYSIS_FEEDBACK_IDENTIFIER } from 'app/entities/feedback.model';
import { ProgrammingExercise } from 'app/entities/programming/programming-exercise.model';
import { BuildLogService } from 'app/programming/service/build-log.service';
import { MockParticipationWebsocketService } from '../../helpers/mocks/service/mock-participation-websocket.service';
import { MockCodeEditorBuildLogService } from '../../helpers/mocks/service/mock-code-editor-build-log.service';
import { OrionBuildAndTestService } from 'app/shared/orion/orion-build-and-test.service';
import { OrionConnectorService } from 'app/shared/orion/orion-connector.service';
import { ProgrammingSubmission } from 'app/entities/programming/programming-submission.model';
import { MockSyncStorage } from '../../helpers/mocks/service/mock-sync-storage.service';
import { MockProvider } from 'ng-mocks';
import { ProgrammingSubmissionService } from 'app/programming/overview/programming-submission.service';
import { provideHttpClient } from '@angular/common/http';
import { AccountService } from 'app/core/auth/account.service';
import { MockAccountService } from '../../helpers/mocks/service/mock-account.service';

describe('OrionBuildAndTestService', () => {
    let serviceUnderTest: OrionBuildAndTestService;
    let programmingSubmissionService: ProgrammingSubmissionService;

    let onBuildFinishedSpy: jest.SpyInstance;
    let onBuildStartedSpy: jest.SpyInstance;
    let onTestResultSpy: jest.SpyInstance;
    let onBuildFailedSpy: jest.SpyInstance;
    let buildLogsStub: jest.SpyInstance;
    let participationSubscriptionStub: jest.SpyInstance;

    const feedbacks: Feedback[] = [
        { id: 2, positive: false, detailText: 'abc', type: FeedbackType.AUTOMATIC, testCase: { testName: 'testBubbleSort', id: 1 } },
        { id: 3, positive: true, detailText: 'cde', type: FeedbackType.AUTOMATIC, testCase: { testName: 'testMergeSort', id: 2 } },
    ];
    const feedbacksWithStaticCodeAnalysis: Feedback[] = [
        ...feedbacks,
        { id: 3, positive: false, detailText: 'fgh', type: FeedbackType.AUTOMATIC, text: STATIC_CODE_ANALYSIS_FEEDBACK_IDENTIFIER + 'a' },
        { id: 4, positive: false, detailText: 'ijk', type: FeedbackType.AUTOMATIC, text: STATIC_CODE_ANALYSIS_FEEDBACK_IDENTIFIER + 'b' },
    ];
    const result = { id: 1 } as Result;
    const submissionFailed = { id: 1, buildFailed: true } as ProgrammingSubmission;
    const submissionSuccess = { id: 1, buildFailed: false } as ProgrammingSubmission;
    const exercise = { id: 42, studentParticipations: [{ id: 32 }] } as ProgrammingExercise;
    const logs = [
        {
            time: '2019-05-15T10:32:11+02:00',
            log: '[ERROR] COMPILATION ERROR : ',
        },
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: ParticipationWebsocketService, useClass: MockParticipationWebsocketService },
                MockProvider(OrionConnectorService),
                { provide: BuildLogService, useClass: MockCodeEditorBuildLogService },
                { provide: LocalStorageService, useClass: MockSyncStorage },
                { provide: SessionStorageService, useClass: MockSyncStorage },
                { provide: AccountService, useClass: MockAccountService },
                provideHttpClient(),
            ],
        });

        serviceUnderTest = TestBed.inject(OrionBuildAndTestService);
        programmingSubmissionService = TestBed.inject(ProgrammingSubmissionService);
        const orionConnectorService = TestBed.inject(OrionConnectorService);
        const buildLogService = TestBed.inject(BuildLogService);
        const participationService = TestBed.inject(ParticipationWebsocketService);

        onBuildFinishedSpy = jest.spyOn(orionConnectorService, 'onBuildFinished');
        onBuildStartedSpy = jest.spyOn(orionConnectorService, 'onBuildStarted');
        onTestResultSpy = jest.spyOn(orionConnectorService, 'onTestResult');
        onBuildFailedSpy = jest.spyOn(orionConnectorService, 'onBuildFailed');
        buildLogsStub = jest.spyOn(buildLogService, 'getBuildLogs');
        participationSubscriptionStub = jest.spyOn(participationService, 'subscribeForLatestResultOfParticipation');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should fetch the build logs if submission is not available', () => {
        buildLogsStub.mockReturnValue(of(logs));
        result.feedbacks = feedbacks;
        const subject = new BehaviorSubject(result);
        participationSubscriptionStub.mockReturnValue(subject);

        serviceUnderTest.listenOnBuildOutputAndForwardChanges(exercise);

        expect(participationSubscriptionStub).toHaveBeenCalledOnce();
        expect(participationSubscriptionStub).toHaveBeenCalledWith(exercise.studentParticipations![0].id, true);
        expect(onBuildStartedSpy).toHaveBeenCalledOnce();
        expect(onTestResultSpy).not.toHaveBeenCalled();
        expect(onBuildFinishedSpy).not.toHaveBeenCalled();
        expect(onBuildFailedSpy).toHaveBeenCalledOnce();
        expect(buildLogsStub).toHaveBeenCalledOnce();
    });

    it('should fetch the build logs if submission is available and the submission could not be build', () => {
        buildLogsStub.mockReturnValue(of(logs));
        result.feedbacks = feedbacks;
        result.submission = submissionFailed;
        const subject = new BehaviorSubject(result);
        participationSubscriptionStub.mockReturnValue(subject);

        serviceUnderTest.listenOnBuildOutputAndForwardChanges(exercise);

        expect(participationSubscriptionStub).toHaveBeenCalledOnce();
        expect(participationSubscriptionStub).toHaveBeenCalledWith(exercise.studentParticipations![0].id, true);
        expect(onBuildStartedSpy).toHaveBeenCalledOnce();
        expect(onTestResultSpy).not.toHaveBeenCalled();
        expect(onBuildFinishedSpy).not.toHaveBeenCalled();
        expect(onBuildFailedSpy).toHaveBeenCalledOnce();
        expect(buildLogsStub).toHaveBeenCalledOnce();
    });

    it('should forward all testcase feedback if build was successful', () => {
        result.feedbacks = feedbacks;
        result.submission = submissionSuccess;
        const subject = new BehaviorSubject(result);
        participationSubscriptionStub.mockReturnValue(subject);

        serviceUnderTest.listenOnBuildOutputAndForwardChanges(exercise);

        expect(participationSubscriptionStub).toHaveBeenCalledOnce();
        expect(participationSubscriptionStub).toHaveBeenCalledWith(exercise.studentParticipations![0].id, true);
        expect(onBuildStartedSpy).toHaveBeenCalledOnce();
        expect(onTestResultSpy).toHaveBeenCalledTimes(2);
        expect(onBuildFinishedSpy).toHaveBeenCalledOnce();
        expect(onBuildFailedSpy).not.toHaveBeenCalled();
        expect(buildLogsStub).not.toHaveBeenCalled();
    });

    it('should filter out static code analysis feedback before forwarding the test case feedback', () => {
        result.feedbacks = feedbacksWithStaticCodeAnalysis;
        result.submission = submissionSuccess;
        const subject = new BehaviorSubject(result);
        participationSubscriptionStub.mockReturnValue(subject);

        serviceUnderTest.listenOnBuildOutputAndForwardChanges(exercise);

        expect(participationSubscriptionStub).toHaveBeenCalledOnce();
        expect(participationSubscriptionStub).toHaveBeenCalledWith(exercise.studentParticipations![0].id, true);
        expect(onBuildStartedSpy).toHaveBeenCalledOnce();
        expect(onTestResultSpy).toHaveBeenCalledTimes(2);
        feedbacks.forEach((feedback, index) => {
            expect(onTestResultSpy).toHaveBeenNthCalledWith(index + 1, feedback.positive, feedback.testCase?.testName, feedback.detailText);
        });
        expect(onBuildFinishedSpy).toHaveBeenCalledOnce();
        expect(onBuildFailedSpy).not.toHaveBeenCalled();
        expect(buildLogsStub).not.toHaveBeenCalled();
    });

    it('should delegate correctly if called buildAndTestExercise', () => {
        const listenOnBuildOutputAndForwardChangesSpy = jest.spyOn(serviceUnderTest, 'listenOnBuildOutputAndForwardChanges');
        const triggerBuildStub = jest.spyOn(programmingSubmissionService, 'triggerBuild').mockReturnValue(of());

        serviceUnderTest.buildAndTestExercise(exercise);

        expect(listenOnBuildOutputAndForwardChangesSpy).toHaveBeenCalledOnce();
        expect(listenOnBuildOutputAndForwardChangesSpy).toHaveBeenCalledWith(exercise);

        expect(triggerBuildStub).toHaveBeenCalledOnce();
        expect(triggerBuildStub).toHaveBeenCalledWith(32);
    });

    it('should unsubscribe from pending subscriptions', () => {
        const resultSubscription = of().subscribe();
        const resultSubscriptionSpy = jest.spyOn(resultSubscription, 'unsubscribe');
        const buildLogSubscription = of().subscribe();
        const buildLogSubscriptionSpy = jest.spyOn(buildLogSubscription, 'unsubscribe');

        // @ts-ignore
        serviceUnderTest.resultSubscription = resultSubscription;
        // @ts-ignore
        serviceUnderTest.buildLogSubscription = buildLogSubscription;

        serviceUnderTest.buildAndTestExercise(exercise);

        expect(resultSubscriptionSpy).toHaveBeenCalledOnce();
        expect(buildLogSubscriptionSpy).toHaveBeenCalledOnce();
    });
});
