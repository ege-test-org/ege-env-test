import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ConfigurationComponent } from 'app/core/admin/configuration/configuration.component';
import { ConfigurationService } from 'app/core/admin/configuration/configuration.service';
import { Bean, PropertySource } from 'app/core/admin/configuration/configuration.model';
import { provideHttpClient } from '@angular/common/http';

describe('Component Tests', () => {
    describe('ConfigurationComponent', () => {
        let comp: ConfigurationComponent;
        let fixture: ComponentFixture<ConfigurationComponent>;
        let service: ConfigurationService;

        beforeEach(waitForAsync(() => {
            TestBed.configureTestingModule({
                providers: [provideHttpClient(), provideHttpClientTesting(), ConfigurationService],
            })
                .overrideTemplate(ConfigurationComponent, '')
                .compileComponents();
        }));

        beforeEach(() => {
            fixture = TestBed.createComponent(ConfigurationComponent);
            comp = fixture.componentInstance;
            service = TestBed.inject(ConfigurationService);
        });

        describe('onInit', () => {
            it('should call load all on init', () => {
                // GIVEN
                const beans: Bean[] = [
                    {
                        prefix: 'jhipster',
                        properties: {
                            clientApp: {
                                name: 'jhipsterApp',
                            },
                        },
                    },
                ];
                const propertySources: PropertySource[] = [
                    {
                        name: 'server.ports',
                        properties: {
                            'local.server.port': {
                                value: '8080',
                            },
                        },
                    },
                ];
                jest.spyOn(service, 'getBeans').mockReturnValue(of(beans));
                jest.spyOn(service, 'getPropertySources').mockReturnValue(of(propertySources));

                // WHEN
                comp.ngOnInit();

                // THEN
                expect(service.getBeans).toHaveBeenCalledOnce();
                expect(service.getPropertySources).toHaveBeenCalledOnce();
                expect(comp.allBeans).toEqual(beans);
                expect(comp.beans).toEqual(beans);
                expect(comp.propertySources).toEqual(propertySources);
            });
        });
    });
});
