import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { SwitchEditModeButtonComponent } from 'app/programming/manage/update/switch-edit-mode-button/switch-edit-mode-button.component';
import { MockTranslateService } from '../../../helpers/mocks/service/mock-translate.service';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('SwitchEditModeButtonComponent', () => {
    let fixture: ComponentFixture<SwitchEditModeButtonComponent>;
    let comp: SwitchEditModeButtonComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SwitchEditModeButtonComponent],
            declarations: [],
            providers: [{ provide: TranslateService, useClass: MockTranslateService }, provideHttpClient(), provideHttpClientTesting()],
        }).compileComponents();

        fixture = TestBed.createComponent(SwitchEditModeButtonComponent);
        comp = fixture.componentInstance;

        fixture.componentRef.setInput('isSimpleMode', false);
    });

    it('should initialize', () => {
        fixture.detectChanges();
        expect(comp).not.toBeNull();
    });

    it('should emit to call passed method when button is clicked', () => {
        const switchEditModeSpy = jest.spyOn(comp.switchEditMode, 'emit');

        const button = fixture.debugElement.query(By.css('jhi-button'));
        button.triggerEventHandler('onClick', null);

        expect(switchEditModeSpy).toHaveBeenCalledOnce();
    });
});
