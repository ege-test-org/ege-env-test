package de.tum.cit.aet.artemis.core.authentication;

import static de.tum.cit.aet.artemis.core.domain.Authority.EDITOR_AUTHORITY;
import static de.tum.cit.aet.artemis.core.domain.Authority.INSTRUCTOR_AUTHORITY;
import static de.tum.cit.aet.artemis.core.domain.Authority.TA_AUTHORITY;
import static de.tum.cit.aet.artemis.core.domain.Authority.USER_AUTHORITY;
import static de.tum.cit.aet.artemis.core.user.util.UserFactory.USER_PASSWORD;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import jakarta.servlet.http.Cookie;
import jakarta.validation.constraints.NotNull;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.util.LinkedMultiValueMap;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import de.tum.cit.aet.artemis.core.domain.Authority;
import de.tum.cit.aet.artemis.core.domain.Course;
import de.tum.cit.aet.artemis.core.domain.User;
import de.tum.cit.aet.artemis.core.dto.vm.LoginVM;
import de.tum.cit.aet.artemis.core.dto.vm.ManagedUserVM;
import de.tum.cit.aet.artemis.core.repository.AuthorityRepository;
import de.tum.cit.aet.artemis.core.security.Role;
import de.tum.cit.aet.artemis.core.security.SecurityUtils;
import de.tum.cit.aet.artemis.core.security.allowedTools.ToolTokenType;
import de.tum.cit.aet.artemis.core.security.jwt.JWTCookieService;
import de.tum.cit.aet.artemis.core.security.jwt.TokenProvider;
import de.tum.cit.aet.artemis.core.service.user.PasswordService;
import de.tum.cit.aet.artemis.core.util.CourseFactory;
import de.tum.cit.aet.artemis.programming.test_repository.ProgrammingExerciseTestRepository;
import de.tum.cit.aet.artemis.programming.util.ProgrammingExerciseUtilService;
import de.tum.cit.aet.artemis.shared.base.AbstractSpringIntegrationJenkinsLocalVcTest;
import de.tum.cit.aet.artemis.tutorialgroup.util.TutorialGroupUtilService;

// TODO: rewrite this test to use LocalVC instead
class InternalAuthenticationIntegrationTest extends AbstractSpringIntegrationJenkinsLocalVcTest {

    private static final String TEST_PREFIX = "internalauth";

    @Autowired
    private PasswordService passwordService;

    @Autowired
    private TokenProvider tokenProvider;

    @Autowired
    private JWTCookieService jwtCookieService;

    @Autowired
    private ProgrammingExerciseTestRepository programmingExerciseRepository;

    @Autowired
    private AuthorityRepository authorityRepository;

    @Autowired
    private ProgrammingExerciseUtilService programmingExerciseUtilService;

    @Autowired
    private TutorialGroupUtilService tutorialGroupUtilService;

    @Value("${info.guided-tour.course-group-students:#{null}}")
    private Optional<String> tutorialGroupStudents;

    @Value("${info.guided-tour.course-group-tutors:#{null}}")
    private Optional<String> tutorialGroupTutors;

    @Value("${info.guided-tour.course-group-editors:#{null}}")
    private Optional<String> tutorialGroupEditors;

    @Value("${info.guided-tour.course-group-instructors:#{null}}")
    private Optional<String> tutorialGroupInstructors;

    private User student;

    private static final String USERNAME = TEST_PREFIX + "student1";

    @BeforeEach
    void setUp() {
        jenkinsRequestMockProvider.enableMockingOfRequests(jenkinsJobPermissionsService);

        userUtilService.addUsers(TEST_PREFIX, 1, 0, 0, 0);
        Course course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise();
        courseUtilService.addOnlineCourseConfigurationToCourse(course);

        final var userAuthority = new Authority(Role.STUDENT.getAuthority());
        final var instructorAuthority = new Authority(Role.INSTRUCTOR.getAuthority());
        final var adminAuthority = new Authority(Role.ADMIN.getAuthority());
        final var taAuthority = new Authority(Role.TEACHING_ASSISTANT.getAuthority());
        authorityRepository.saveAll(List.of(userAuthority, instructorAuthority, adminAuthority, taAuthority));

        student = userTestRepository.findOneWithGroupsAndAuthoritiesByLogin(USERNAME).orElseThrow();
        final var encodedPassword = passwordService.hashPassword(USER_PASSWORD);
        student.setPassword(encodedPassword);
        student.setInternal(true);
        userTestRepository.save(student);
    }

    @AfterEach
    void teardown() {
        // Set the student group to some other group because only one group can have the tutorialGroupStudents-group
        SecurityUtils.setAuthorizationObject();
        var tutorialCourse = courseRepository.findCourseByStudentGroupName(tutorialGroupStudents.orElseThrow());
        if (tutorialCourse != null) {
            tutorialCourse.setStudentGroupName("non-tutorial-course");
            tutorialCourse.setTeachingAssistantGroupName("non-tutorial-course");
            tutorialCourse.setEditorGroupName("non-tutorial-course");
            tutorialCourse.setInstructorGroupName("non-tutorial-course");
            courseRepository.save(tutorialCourse);
        }
    }

    @Test
    @WithMockUser(username = "ab12cde")
    void registerForCourse_internalAuth_success() throws Exception {
        final var student = userUtilService.createAndSaveUser("ab12cde");

        final var pastTimestamp = ZonedDateTime.now().minusDays(5);
        final var futureTimestamp = ZonedDateTime.now().plusDays(5);
        var course1 = CourseFactory.generateCourse(null, pastTimestamp, futureTimestamp, new HashSet<>(), "testcourse1", "tutor", "editor", "instructor");
        course1.setEnrollmentEnabled(true);
        course1 = courseRepository.save(course1);

        jenkinsRequestMockProvider.mockUpdateUserAndGroups(student.getLogin(), student, student.getGroups(), Set.of(), false);
        Set<String> updatedGroups = request.postWithResponseBody("/api/core/courses/" + course1.getId() + "/enroll", null, Set.class, HttpStatus.OK);
        assertThat(updatedGroups).as("User is registered for course").contains(course1.getStudentGroupName());
    }

    @NotNull
    private User createUserWithRestApi(Set<Authority> authorities) throws Exception {
        userTestRepository.findOneByLogin("user1").ifPresent(userTestRepository::delete);
        tutorialGroupUtilService.addTutorialCourse();

        student.setId(null);
        student.setLogin("user1");
        student.setPassword("foobar");
        student.setEmail("user1@secret.invalid");
        student.setAuthorities(authorities);

        var exercises = programmingExerciseRepository.findAllByInstructorOrEditorOrTAGroupNameIn(student.getGroups());
        assertThat(exercises).isEmpty();
        jenkinsRequestMockProvider.mockCreateUser(student, false, false, false);

        final var user = request.postWithResponseBody("/api/core/admin/users", new ManagedUserVM(student), User.class, HttpStatus.CREATED);
        assertThat(user).isNotNull();
        return user;
    }

    private void assertUserGroups(User user, boolean students, boolean tutors, boolean editors, boolean instructors) {
        if (students) {
            assertThat(user.getGroups()).contains(tutorialGroupStudents.orElseThrow());
        }
        else {
            assertThat(user.getGroups()).doesNotContain(tutorialGroupStudents.orElseThrow());
        }
        if (tutors) {
            assertThat(user.getGroups()).contains(tutorialGroupTutors.orElseThrow());
        }
        else {
            assertThat(user.getGroups()).doesNotContain(tutorialGroupTutors.orElseThrow());
        }
        if (editors) {
            assertThat(user.getGroups()).contains(tutorialGroupEditors.orElseThrow());
        }
        else {
            assertThat(user.getGroups()).doesNotContain(tutorialGroupEditors.orElseThrow());
        }
        if (instructors) {
            assertThat(user.getGroups()).contains(tutorialGroupInstructors.orElseThrow());
        }
        else {
            assertThat(user.getGroups()).doesNotContain(tutorialGroupInstructors.orElseThrow());
        }
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void createUserWithInternalUserManagementAndAutomatedTutorialGroupsAssignment() throws Exception {
        final User user = createUserWithRestApi(Set.of(USER_AUTHORITY));
        assertUserGroups(user, true, false, false, false);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void createTutorWithInternalUserManagementAndAutomatedTutorialGroupsAssignment() throws Exception {
        final User user = createUserWithRestApi(Set.of(USER_AUTHORITY, TA_AUTHORITY));
        assertUserGroups(user, true, true, false, false);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void createEditorWithInternalUserManagementAndAutomatedTutorialGroupsAssignment() throws Exception {
        final User user = createUserWithRestApi(Set.of(USER_AUTHORITY, TA_AUTHORITY, EDITOR_AUTHORITY));
        assertUserGroups(user, true, true, true, false);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void createInstructorWithInternalUserManagementAndAutomatedTutorialGroupsAssignment() throws Exception {
        final User user = createUserWithRestApi(Set.of(USER_AUTHORITY, TA_AUTHORITY, EDITOR_AUTHORITY, INSTRUCTOR_AUTHORITY));
        assertUserGroups(user, true, true, true, true);
    }

    @Test
    @WithAnonymousUser
    void testJWTAuthentication() throws Exception {
        LoginVM loginVM = new LoginVM();
        loginVM.setUsername(USERNAME);
        loginVM.setPassword(USER_PASSWORD);
        loginVM.setRememberMe(true);

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36");

        MockHttpServletResponse response = request.postWithoutResponseBody("/api/core/public/authenticate", loginVM, HttpStatus.OK, httpHeaders);
        AuthenticationIntegrationTestHelper.authenticationCookieAssertions(response.getCookie("jwt"), false);

        var responseBody = new ObjectMapper().readValue(response.getContentAsString(), new TypeReference<Map<String, Object>>() {
        });
        assertThat(tokenProvider.validateTokenForAuthority(responseBody.get("access_token").toString(), null)).isTrue();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testScorpioTokenGeneration() throws Exception {
        ResponseCookie responseCookie = jwtCookieService.buildLoginCookie(true);

        Cookie cookie = new Cookie(responseCookie.getName(), responseCookie.getValue());
        cookie.setMaxAge((int) responseCookie.getMaxAge().toMillis());

        var initialLifetime = tokenProvider.getExpirationDate(cookie.getValue()).getTime() - System.currentTimeMillis();

        LinkedMultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("tool", ToolTokenType.SCORPIO.toString());

        var responseBody = request.performMvcRequest(post("/api/core/tool-token").cookie(cookie).params(params)).andExpect(status().isOk()).andReturn().getResponse()
                .getContentAsString();

        AuthenticationIntegrationTestHelper.toolTokenAssertions(tokenProvider, responseBody, initialLifetime, ToolTokenType.SCORPIO);
    }

    @Test
    @WithAnonymousUser
    void testJWTAuthenticationLogoutAnonymous() throws Exception {

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36");

        MockHttpServletResponse response = request.postWithoutResponseBody("/api/core/public/logout", HttpStatus.OK, httpHeaders);
        AuthenticationIntegrationTestHelper.authenticationCookieAssertions(response.getCookie("jwt"), true);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testJWTAuthenticationLogout() throws Exception {

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36");

        MockHttpServletResponse response = request.postWithoutResponseBody("/api/core/public/logout", HttpStatus.OK, httpHeaders);
        AuthenticationIntegrationTestHelper.authenticationCookieAssertions(response.getCookie("jwt"), true);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void updateUserWithRemovedGroups_internalAuth_successful() throws Exception {
        final var oldGroups = student.getGroups();
        final var newGroups = Set.of("foo", "bar");
        student.setGroups(newGroups);
        final var managedUserVM = new ManagedUserVM(student);
        managedUserVM.setPassword("12345678");

        jenkinsRequestMockProvider.mockUpdateUserAndGroups(student.getLogin(), student, newGroups, oldGroups, false);

        final var response = request.putWithResponseBody("/api/core/admin/users", managedUserVM, User.class, HttpStatus.OK);
        final var updatedUserIndDB = userTestRepository.findOneWithGroupsAndAuthoritiesByLogin(student.getLogin()).orElseThrow();

        assertThat(passwordService.checkPasswordMatch(managedUserVM.getPassword(), updatedUserIndDB.getPassword())).isTrue();

        // Skip passwords for comparison
        updatedUserIndDB.setPassword(null);
        student.setPassword(null);

        assertThat(response).isNotNull();
        assertThat(student).as("Returned user is equal to sent update").isEqualTo(response);
        assertThat(student).as("Updated user in DB is equal to sent update").isEqualTo(updatedUserIndDB);
    }
}
