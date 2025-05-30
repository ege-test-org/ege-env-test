import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { User } from 'app/core/user/user.model';
import { UserService } from 'app/core/user/shared/user.service';
import { CourseGroupComponent, GroupUserInformationRow } from 'app/shared/course-group/course-group.component';
import { CourseGroup } from 'app/entities/course.model';
import dayjs from 'dayjs/esm';
import { LocalStorageService, SessionStorageService } from 'ngx-webstorage';
import { Observable, of, throwError } from 'rxjs';
import { MockSyncStorage } from '../../helpers/mocks/service/mock-sync-storage.service';
import { EMAIL_KEY, NAME_KEY, REGISTRATION_NUMBER_KEY, USERNAME_KEY } from 'app/shared/export/export-constants';
import { MockTranslateService } from '../../helpers/mocks/service/mock-translate.service';
import { TranslateService } from '@ngx-translate/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('CourseGroupComponent', () => {
    let comp: CourseGroupComponent;
    let fixture: ComponentFixture<CourseGroupComponent>;
    let userService: UserService;
    const courseGroup = CourseGroup.STUDENTS;
    const course = { id: 123, title: 'Course Title', isAtLeastInstructor: true, endDate: dayjs().subtract(5, 'minutes'), courseArchivePath: 'some-path' };
    const parentRoute = {
        data: of({ course }),
    } as any as ActivatedRoute;
    const route = { parent: parentRoute, params: of({ courseGroup }) } as any as ActivatedRoute;
    const courseGroupUser = new User(1, 'user');
    const courseGroupUser2 = new User(2, 'user2');

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: ActivatedRoute, useValue: route },
                { provide: LocalStorageService, useClass: MockSyncStorage },
                { provide: SessionStorageService, useClass: MockSyncStorage },
                { provide: TranslateService, useClass: MockTranslateService },
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(CourseGroupComponent);
                comp = fixture.componentInstance;
                userService = TestBed.inject(UserService);
                comp.userSearch = (searchTerm: string) => userService.search(searchTerm);
            });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should initialize', () => {
        fixture.detectChanges();
        expect(comp).not.toBeNull();
    });

    describe('searchAllUsers', () => {
        let loginOrName: string;
        let loginStream: Observable<{ text: string; entities: User[] }>;
        let searchStub: jest.SpyInstance;

        beforeEach(() => {
            loginOrName = 'testLoginOrName';
            loginStream = of({ text: loginOrName, entities: [] });
            searchStub = jest.spyOn(userService, 'search');
        });

        it('should search users for given login or name', () => {
            searchStub.mockReturnValue(of(new HttpResponse({ body: [courseGroupUser] })));
            comp.searchAllUsers(loginStream).subscribe((users: any) => {
                expect(users).toEqual([courseGroupUser]);
            });
            expect(searchStub).toHaveBeenCalledWith(loginOrName);
            expect(searchStub).toHaveBeenCalledOnce();
        });

        it('should set search no results if search returns no result', () => {
            searchStub.mockReturnValue(of(new HttpResponse({ body: [] })));
            comp.searchAllUsers(loginStream).subscribe((users: any) => {
                expect(users).toEqual([]);
            });
            expect(comp.searchNoResults).toBeTrue();
            expect(searchStub).toHaveBeenCalledWith(loginOrName);
            expect(searchStub).toHaveBeenCalledOnce();
        });

        it('should return empty if search text is shorter than three characters', () => {
            loginStream = of({ text: 'ab', entities: [] });
            searchStub.mockReturnValue(of(new HttpResponse({ body: [courseGroupUser] })));
            comp.searchAllUsers(loginStream).subscribe((users: any) => {
                expect(users).toEqual([]);
            });
            expect(searchStub).not.toHaveBeenCalled();
        });

        it('should return empty if search fails', () => {
            searchStub.mockReturnValue(throwError(() => new Error('')));
            comp.searchAllUsers(loginStream).subscribe((users: any) => {
                expect(users).toEqual([]);
            });
            expect(comp.searchFailed).toBeTrue();
            expect(searchStub).toHaveBeenCalledWith(loginOrName);
            expect(searchStub).toHaveBeenCalledOnce();
        });
    });

    describe('onAutocompleteSelect', () => {
        let addUserStub: jest.SpyInstance;
        let user: User;

        beforeEach(() => {
            addUserStub = jest.spyOn(comp, 'addUserToGroup').mockReturnValue(of(new HttpResponse<void>()));
            user = courseGroupUser;
            comp.allGroupUsers = [];
            comp.course = course;
            comp.courseGroup = courseGroup;
        });

        it('should add the selected user to course group', () => {
            const fake = jest.fn();
            comp.onAutocompleteSelect(user, fake);
            expect(addUserStub).toHaveBeenCalledWith(user.login);
            expect(addUserStub).toHaveBeenCalledOnce();
            expect(comp.allGroupUsers).toEqual([courseGroupUser]);
            expect(fake).toHaveBeenCalledWith(user);
            expect(fake).toHaveBeenCalledOnce();
        });

        it('should call callback if user is already in the group', () => {
            const fake = jest.fn();
            comp.allGroupUsers = [user];
            comp.onAutocompleteSelect(user, fake);
            expect(addUserStub).not.toHaveBeenCalled();
            expect(comp.allGroupUsers).toEqual([courseGroupUser]);
            expect(fake).toHaveBeenCalledWith(user);
            expect(fake).toHaveBeenCalledOnce();
        });
    });

    describe('removeFromGroup', () => {
        let removeUserStub: jest.SpyInstance;

        beforeEach(() => {
            removeUserStub = jest.spyOn(comp, 'removeUserFromGroup').mockReturnValue(of(new HttpResponse<void>()));
            comp.allGroupUsers = [courseGroupUser, courseGroupUser2];
            comp.course = course;
            comp.courseGroup = courseGroup;
        });

        it('should given user from group', () => {
            comp.removeFromGroup(courseGroupUser);
            expect(removeUserStub).toHaveBeenCalledWith(courseGroupUser.login);
            expect(removeUserStub).toHaveBeenCalledOnce();
            expect(comp.allGroupUsers).toEqual([courseGroupUser2]);
        });

        it('should not do anything if users has no login', () => {
            const user = { ...courseGroupUser };
            delete user.login;
            comp.removeFromGroup(user);
            expect(removeUserStub).not.toHaveBeenCalled();
        });
    });
    describe('searchResultFormatter', () => {
        it('should format user info into appropriate format', () => {
            const name = 'testName';
            const user = { ...courseGroupUser, name };
            expect(comp.searchResultFormatter(user)).toBe(`${name} (${user.login})`);
        });
    });

    describe('searchTextFromUser', () => {
        it('converts a user to a string that can be searched for', () => {
            const user = courseGroupUser;
            expect(comp.searchTextFromUser(user)).toBe(user.login);
        });

        it('should return empty string if user does not have login', () => {
            const user = { ...courseGroupUser };
            delete user.login;
            expect(comp.searchTextFromUser(user)).toBe('');
        });
    });

    it('should generate csv correctly', () => {
        comp.allGroupUsers = [courseGroupUser, courseGroupUser2];
        comp.courseGroup = CourseGroup.STUDENTS;
        comp.course = course;
        const exportAsCsvMock = jest.spyOn(comp, 'exportAsCsv').mockImplementation();

        comp.exportUserInformation();

        expect(exportAsCsvMock).toHaveBeenCalledOnce();
        const generatedRows = exportAsCsvMock.mock.calls[0][0];

        const expectedRow1 = {} as GroupUserInformationRow;
        expectedRow1[NAME_KEY] = '';
        expectedRow1[USERNAME_KEY] = courseGroupUser.login ?? '';
        expectedRow1[EMAIL_KEY] = '';
        expectedRow1[REGISTRATION_NUMBER_KEY] = '';

        const expectedRow2 = {} as GroupUserInformationRow;
        expectedRow2[NAME_KEY] = '';
        expectedRow2[USERNAME_KEY] = courseGroupUser2.login ?? '';
        expectedRow2[EMAIL_KEY] = '';
        expectedRow2[REGISTRATION_NUMBER_KEY] = '';

        const expectedRows = [expectedRow1, expectedRow2];

        expect(generatedRows).toEqual(expectedRows);
    });
});
