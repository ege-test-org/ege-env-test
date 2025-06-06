import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IrisSettingsUpdateComponent } from 'app/iris/manage/settings/iris-settings-update/iris-settings-update.component';
import { IrisSettingsService } from 'app/iris/manage/settings/shared/iris-settings.service';
import { MockComponent, MockProvider } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { ButtonComponent } from 'app/shared/components/button.component';
import { IrisCommonSubSettingsUpdateComponent } from 'app/iris/manage/settings/iris-settings-update/iris-common-sub-settings-update/iris-common-sub-settings-update.component';
import { mockEmptySettings, mockSettings } from './mock-settings';
import { ActivatedRoute, Params, provideRouter } from '@angular/router';
import { IrisCourseSettingsUpdateComponent } from 'app/iris/manage/settings/iris-course-settings-update/iris-course-settings-update.component';
import { By } from '@angular/platform-browser';
import { IrisSettings } from 'app/entities/iris/settings/iris-settings.model';
import { HttpResponse } from '@angular/common/http';
import { MockJhiTranslateDirective } from '../../../helpers/mocks/directive/mock-jhi-translate-directive.directive';
import { MockTranslateService } from '../../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { MockAccountService } from '../../../helpers/mocks/service/mock-account.service';

describe('IrisCourseSettingsUpdateComponent Component', () => {
    let comp: IrisCourseSettingsUpdateComponent;
    let fixture: ComponentFixture<IrisCourseSettingsUpdateComponent>;
    let irisSettingsService: IrisSettingsService;
    const routeParamsSubject = new BehaviorSubject<Params>({ courseId: '1' });
    const route = { params: routeParamsSubject.asObservable() } as ActivatedRoute;
    let paramsSpy: jest.SpyInstance;
    let getSettingsSpy: jest.SpyInstance;
    let getParentSettingsSpy: jest.SpyInstance;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [MockJhiTranslateDirective],
            declarations: [IrisCourseSettingsUpdateComponent, IrisSettingsUpdateComponent, MockComponent(IrisCommonSubSettingsUpdateComponent), MockComponent(ButtonComponent)],
            providers: [
                provideRouter([]),
                MockProvider(IrisSettingsService),
                { provide: ActivatedRoute, useValue: route },
                { provide: TranslateService, useClass: MockTranslateService },
                { provide: AccountService, useClass: MockAccountService },
            ],
        })
            .compileComponents()
            .then(() => {
                irisSettingsService = TestBed.inject(IrisSettingsService);

                // Setup
                routeParamsSubject.next({ courseId: 1 });
                paramsSpy = jest.spyOn(route!.params, 'subscribe');

                const irisSettings = mockSettings();
                getSettingsSpy = jest.spyOn(irisSettingsService, 'getUncombinedCourseSettings').mockReturnValue(of(irisSettings));
                getParentSettingsSpy = jest.spyOn(irisSettingsService, 'getGlobalSettings').mockReturnValue(of(irisSettings));
            });
        fixture = TestBed.createComponent(IrisCourseSettingsUpdateComponent);
        comp = fixture.componentInstance;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should create IrisCourseSettingsUpdateComponent', () => {
        expect(comp).toBeDefined();
    });

    it('Setup works correctly', () => {
        fixture.detectChanges();
        expect(paramsSpy).toHaveBeenCalledOnce();
        expect(comp.courseId).toBe(1);
        expect(comp.settingsUpdateComponent).toBeTruthy();
        expect(getSettingsSpy).toHaveBeenCalledWith(1);
        expect(getParentSettingsSpy).toHaveBeenCalledOnce();

        expect(fixture.debugElement.queryAll(By.directive(IrisCommonSubSettingsUpdateComponent))).toHaveLength(7);
    });

    it('Can deactivate correctly', () => {
        fixture.detectChanges();
        expect(comp.canDeactivate()).toBeTrue();
        comp.settingsUpdateComponent!.isDirty = true;
        expect(comp.canDeactivate()).toBeFalse();
        comp.settingsUpdateComponent!.canDeactivateWarning = 'Warning';
        expect(comp.canDeactivateWarning).toBe('Warning');
    });

    it('Saves settings correctly', () => {
        fixture.detectChanges();
        const irisSettings = mockSettings();
        irisSettings.id = undefined;
        const irisSettingsSaved = mockSettings();
        const setSettingsSpy = jest.spyOn(irisSettingsService, 'setCourseSettings').mockReturnValue(of(new HttpResponse<IrisSettings>({ body: irisSettingsSaved })));
        comp.settingsUpdateComponent!.irisSettings = irisSettings;
        comp.settingsUpdateComponent!.saveIrisSettings();
        expect(setSettingsSpy).toHaveBeenCalledWith(1, irisSettings);
        expect(comp.settingsUpdateComponent!.irisSettings).toEqual(irisSettingsSaved);
    });

    it('Fills the settings if they are empty', () => {
        fixture.detectChanges();
        comp.settingsUpdateComponent!.irisSettings = mockEmptySettings();
        comp.settingsUpdateComponent!.fillEmptyIrisSubSettings();
        expect(comp.settingsUpdateComponent!.irisSettings.irisChatSettings).toBeTruthy();
        expect(comp.settingsUpdateComponent!.irisSettings.irisTextExerciseChatSettings).toBeTruthy();
        expect(comp.settingsUpdateComponent!.irisSettings.irisCourseChatSettings).toBeTruthy();
        expect(comp.settingsUpdateComponent!.irisSettings.irisLectureIngestionSettings).toBeTruthy();
        expect(comp.settingsUpdateComponent!.irisSettings.irisCompetencyGenerationSettings).toBeTruthy();
        expect(comp.settingsUpdateComponent!.irisSettings.irisFaqIngestionSettings).toBeTruthy();
    });
});
