import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LogsService } from 'app/core/admin/logs/logs.service';
import { Log } from 'app/core/admin/logs/log.model';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('Logs Service', () => {
    let service: LogsService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });

        service = TestBed.inject(LogsService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('Service methods', () => {
        it('should call correct URL', fakeAsync(() => {
            const resourceUrl = 'management/loggers';

            service.findAll().subscribe(() => {});

            const req = httpMock.expectOne({ method: 'GET' });
            expect(req.request.url).toEqual(resourceUrl);
            tick();
        }));

        it('should return Logs', fakeAsync(() => {
            const log = new Log('main', 'ERROR');

            service.findAll().subscribe((resp) => expect(resp).toEqual(log));

            const req = httpMock.expectOne({ method: 'GET' });
            req.flush(log);
            tick();
        }));

        it('should change log level', fakeAsync(() => {
            const log = new Log('new', 'ERROR');

            service.changeLevel(log.name, log.level).subscribe((received) => expect(received).toEqual(log));

            const req = httpMock.expectOne({ method: 'POST' });
            req.flush(log);
            tick();
        }));
    });
});
