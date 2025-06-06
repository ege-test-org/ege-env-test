import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BuildAgentSummaryComponent } from 'app/buildagent/build-agent-summary/build-agent-summary.component';
import { WebsocketService } from 'app/shared/service/websocket.service';
import { of, throwError } from 'rxjs';
import { BuildJob } from 'app/entities/programming/build-job.model';
import dayjs from 'dayjs/esm';
import { DataTableComponent } from 'app/shared/data-table/data-table.component';
import { MockProvider } from 'ng-mocks';
import { BuildAgentInformation, BuildAgentStatus } from '../../../../../../main/webapp/app/entities/programming/build-agent-information.model';
import { RepositoryInfo, TriggeredByPushTo } from 'app/entities/programming/repository-info.model';
import { JobTimingInfo } from 'app/entities/job-timing-info.model';
import { BuildConfig } from 'app/entities/programming/build-config.model';
import { AlertService, AlertType } from 'app/shared/service/alert.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockNgbModalService } from '../../../helpers/mocks/service/mock-ngb-modal.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BuildAgentsService } from 'app/buildagent/build-agents.service';

describe('BuildAgentSummaryComponent', () => {
    let component: BuildAgentSummaryComponent;
    let fixture: ComponentFixture<BuildAgentSummaryComponent>;

    const mockWebsocketService = {
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        receive: jest.fn().mockReturnValue(of([])),
    };

    const mockBuildAgentsService = {
        getBuildAgentSummary: jest.fn().mockReturnValue(of([])),
        pauseAllBuildAgents: jest.fn().mockReturnValue(of({})),
        resumeAllBuildAgents: jest.fn().mockReturnValue(of({})),
        clearDistributedData: jest.fn().mockReturnValue(of({})),
    };

    const repositoryInfo: RepositoryInfo = {
        repositoryName: 'repo2',
        repositoryType: 'USER',
        triggeredByPushTo: TriggeredByPushTo.USER,
        assignmentRepositoryUri: 'https://some.uri',
        testRepositoryUri: 'https://some.uri',
        solutionRepositoryUri: 'https://some.uri',
        auxiliaryRepositoryUris: [],
        auxiliaryRepositoryCheckoutDirectories: [],
    };

    const jobTimingInfo1: JobTimingInfo = {
        submissionDate: dayjs('2023-01-01'),
        buildStartDate: dayjs('2023-01-01'),
        buildCompletionDate: dayjs('2023-01-02'),
        buildDuration: undefined,
    };

    const buildConfig: BuildConfig = {
        dockerImage: 'someImage',
        commitHashToBuild: 'abc124',
        branch: 'main',
        programmingLanguage: 'Java',
        projectType: 'Maven',
        scaEnabled: false,
        sequentialTestRunsEnabled: false,
        resultPaths: [],
    };

    const mockRunningJobs1: BuildJob[] = [
        {
            id: '2',
            name: 'Build Job 2',
            buildAgent: { name: 'agent2', memberAddress: 'localhost:8080', displayName: 'Agent 2' },
            participationId: 102,
            courseId: 10,
            exerciseId: 100,
            retryCount: 0,
            priority: 3,
            repositoryInfo: repositoryInfo,
            jobTimingInfo: jobTimingInfo1,
            buildConfig: buildConfig,
        },
        {
            id: '4',
            name: 'Build Job 4',
            buildAgent: { name: 'agent4', memberAddress: 'localhost:8080', displayName: 'Agent 4' },
            participationId: 104,
            courseId: 10,
            exerciseId: 100,
            retryCount: 0,
            priority: 2,
            repositoryInfo: repositoryInfo,
            jobTimingInfo: jobTimingInfo1,
            buildConfig: buildConfig,
        },
    ];

    const mockBuildAgents: BuildAgentInformation[] = [
        {
            id: 1,
            buildAgent: { name: 'buildagent1', displayName: 'Build Agent 1', memberAddress: 'agent1' },
            maxNumberOfConcurrentBuildJobs: 2,
            numberOfCurrentBuildJobs: 2,
            status: BuildAgentStatus.ACTIVE,
        },
        {
            id: 2,
            buildAgent: { name: 'buildagent2', displayName: 'Build Agent 2', memberAddress: 'agent2' },
            maxNumberOfConcurrentBuildJobs: 2,
            numberOfCurrentBuildJobs: 2,
            status: BuildAgentStatus.ACTIVE,
        },
    ];
    let alertService: AlertService;
    let alertServiceAddAlertStub: jest.SpyInstance;
    let modalService: NgbModal;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [],
            providers: [
                { provide: WebsocketService, useValue: mockWebsocketService },
                { provide: BuildAgentsService, useValue: mockBuildAgentsService },
                { provide: DataTableComponent, useClass: DataTableComponent },
                { provide: NgbModal, useClass: MockNgbModalService },
                MockProvider(AlertService),
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(BuildAgentSummaryComponent);
        component = fixture.componentInstance;
        alertService = TestBed.inject(AlertService);
        modalService = TestBed.inject(NgbModal);
        alertServiceAddAlertStub = jest.spyOn(alertService, 'addAlert');
    }));

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should load build agents on initialization', () => {
        mockBuildAgentsService.getBuildAgentSummary.mockReturnValue(of(mockBuildAgents));
        mockWebsocketService.receive.mockReturnValue(of(mockBuildAgents));

        component.ngOnInit();

        expect(mockBuildAgentsService.getBuildAgentSummary).toHaveBeenCalled();
        expect(component.buildAgents).toEqual(mockBuildAgents);
    });

    it('should initialize websocket subscription on initialization', () => {
        mockWebsocketService.receive.mockReturnValue(of(mockBuildAgents));

        component.ngOnInit();

        expect(component.buildAgents).toEqual(mockBuildAgents);
        expect(mockWebsocketService.subscribe).toHaveBeenCalledWith('/topic/admin/build-agents');
        expect(mockWebsocketService.receive).toHaveBeenCalledWith('/topic/admin/build-agents');
    });

    it('should unsubscribe from the websocket channel on destruction', () => {
        component.ngOnDestroy();

        expect(mockWebsocketService.unsubscribe).toHaveBeenCalledWith('/topic/admin/build-agents');
    });

    it('should cancel a build job', () => {
        const buildJob = mockRunningJobs1[0];
        const spy = jest.spyOn(component, 'cancelBuildJob');

        component.ngOnInit();
        component.cancelBuildJob(buildJob.id!);

        expect(spy).toHaveBeenCalledExactlyOnceWith(buildJob.id!);
    });

    it('should cancel all build jobs of a build agent', () => {
        const buildAgent = mockBuildAgents[0];
        const spy = jest.spyOn(component, 'cancelAllBuildJobs');

        component.ngOnInit();
        component.cancelAllBuildJobs(buildAgent.buildAgent);

        expect(spy).toHaveBeenCalledExactlyOnceWith(buildAgent.buildAgent);
    });

    it('should calculate the build capacity and current builds', () => {
        mockWebsocketService.receive.mockReturnValue(of(mockBuildAgents));

        component.ngOnInit();

        expect(component.buildCapacity).toBe(4);
        expect(component.currentBuilds).toBe(4);
    });

    it('should calculate the build capacity and current builds when there are no build agents', () => {
        mockWebsocketService.receive.mockReturnValue(of([]));

        component.ngOnInit();

        expect(component.buildCapacity).toBe(0);
        expect(component.currentBuilds).toBe(0);
    });

    it('should call correct service method when pausing and resuming build agents', () => {
        component.pauseAllBuildAgents();
        expect(alertServiceAddAlertStub).toHaveBeenCalledWith({
            type: AlertType.SUCCESS,
            message: 'artemisApp.buildAgents.alerts.buildAgentsPaused',
        });

        component.resumeAllBuildAgents();
        expect(alertServiceAddAlertStub).toHaveBeenCalledWith({
            type: AlertType.SUCCESS,
            message: 'artemisApp.buildAgents.alerts.buildAgentsResumed',
        });
    });

    it('should show alert when error in pausing or resuming build agents', () => {
        mockBuildAgentsService.pauseAllBuildAgents.mockReturnValue(throwError(() => new Error()));

        component.pauseAllBuildAgents();
        expect(alertServiceAddAlertStub).toHaveBeenCalledWith({
            type: AlertType.DANGER,
            message: 'artemisApp.buildAgents.alerts.buildAgentPauseFailed',
        });

        mockBuildAgentsService.resumeAllBuildAgents.mockReturnValue(throwError(() => new Error()));

        component.resumeAllBuildAgents();
        expect(alertServiceAddAlertStub).toHaveBeenCalledWith({
            type: AlertType.DANGER,
            message: 'artemisApp.buildAgents.alerts.buildAgentResumeFailed',
        });
    });

    it('should call correct service method when clearing distributed data', () => {
        component.clearDistributedData();
        expect(alertServiceAddAlertStub).toHaveBeenCalledWith({
            type: AlertType.SUCCESS,
            message: 'artemisApp.buildAgents.alerts.distributedDataCleared',
        });
    });

    it('should show alert when error in clearing distributed data', () => {
        mockBuildAgentsService.clearDistributedData.mockReturnValue(throwError(() => new Error()));

        component.clearDistributedData();
        expect(alertServiceAddAlertStub).toHaveBeenCalledWith({
            type: AlertType.DANGER,
            message: 'artemisApp.buildAgents.alerts.distributedDataClearFailed',
        });
    });

    it('should correctly open modals', () => {
        const modalRef = {
            result: Promise.resolve('close'),
        } as NgbModalRef;
        const openSpy = jest.spyOn(modalService, 'open').mockReturnValue(modalRef);

        component.displayPauseBuildAgentModal();
        expect(openSpy).toHaveBeenCalledTimes(1);

        component.displayClearDistributedDataModal();
        expect(openSpy).toHaveBeenCalledTimes(2);
    });
});
