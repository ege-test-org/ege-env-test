package de.tum.cit.aet.artemis.programming;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MvcResult;

import de.tum.cit.aet.artemis.core.domain.Course;
import de.tum.cit.aet.artemis.core.domain.User;
import de.tum.cit.aet.artemis.core.util.CourseFactory;

class CourseLocalVcJenkinsIntegrationTest extends AbstractProgrammingIntegrationJenkinsLocalVcTest {

    private static final String TEST_PREFIX = "courselocalvcjenkins";

    @BeforeEach
    void setup() {
        courseTestService.setup(TEST_PREFIX, this);
        jenkinsRequestMockProvider.enableMockingOfRequests(jenkinsJobPermissionsService);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateCourseWithPermission() throws Exception {
        courseTestService.testCreateCourseWithPermission();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateCourseWithSameShortName() throws Exception {
        courseTestService.testCreateCourseWithSameShortName();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateCourseWithNegativeMaxComplainNumber() throws Exception {
        courseTestService.testCreateCourseWithNegativeMaxComplainNumber();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateCourseWithNegativeMaxComplainTimeDays() throws Exception {
        courseTestService.testCreateCourseWithNegativeMaxComplainTimeDays();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateCourseWithNegativeMaxTeamComplainNumber() throws Exception {
        courseTestService.testCreateCourseWithNegativeMaxTeamComplainNumber();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateCourseWithNegativeMaxComplaintTextLimit() throws Exception {
        courseTestService.testCreateCourseWithNegativeMaxComplaintTextLimit();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateCourseWithNegativeMaxComplaintResponseTextLimit() throws Exception {
        courseTestService.testCreateCourseWithNegativeMaxComplaintResponseTextLimit();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateCourseWithModifiedMaxComplainTimeDaysAndMaxComplains() throws Exception {
        courseTestService.testCreateCourseWithModifiedMaxComplainTimeDaysAndMaxComplains();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateCourseWithCustomNonExistingGroupNames() throws Exception {
        courseTestService.testCreateCourseWithCustomNonExistingGroupNames();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateCourseWithOptions() throws Exception {
        courseTestService.testCreateCourseWithOptions();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testDeleteCourseWithPermission() throws Exception {
        courseTestService.testDeleteCourseWithPermission();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testDeleteNotExistingCourse() throws Exception {
        courseTestService.testDeleteNotExistingCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testCreateCourseWithoutPermission() throws Exception {
        courseTestService.testCreateCourseWithoutPermission();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateCourseWithWrongShortName() throws Exception {
        courseTestService.testCreateCourseWithWrongShortName();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateDefaultCourseChannelsOnCourseCreation() throws Exception {
        courseTestService.testCreateCourseWithDefaultChannels();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testUpdateCourseIsEmpty() throws Exception {
        courseTestService.testUpdateCourseIsEmpty();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testEditCourseWithPermission() throws Exception {
        courseTestService.testEditCourseWithPermission();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testEditCourseShouldPreserveAssociations() throws Exception {
        courseTestService.testEditCourseShouldPreserveAssociations();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testUpdateCourseGroups() throws Exception {
        courseTestService.testUpdateCourseGroups();
    }

    // TODO: enable or remove the test
    @Disabled
    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateAndUpdateCourseWithCourseImage() throws Exception {
        courseTestService.testCreateAndUpdateCourseWithCourseImage();
    }

    // TODO: enable or remove the test
    @Disabled
    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateAndUpdateCourseWithPersistentCourseImageOnUpdate() throws Exception {
        courseTestService.testCreateAndUpdateCourseWithPersistentCourseImageOnUpdate();
    }

    // TODO: enable or remove the test
    @Disabled
    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateAndUpdateCourseWithRemoveCourseImageOnUpdate() throws Exception {
        courseTestService.testCreateAndUpdateCourseWithRemoveCourseImageOnUpdate();
    }

    // TODO: enable or remove the test
    @Disabled
    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateAndUpdateCourseWithSetNewImageDespiteRemoval() throws Exception {
        courseTestService.testCreateAndUpdateCourseWithSetNewImageDespiteRemoval();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testUpdateOldMembersInCourse() throws Exception {
        Course course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise();
        var oldInstructorGroup = course.getInstructorGroupName();
        course.setInstructorGroupName("new-editor-group");

        changeUserGroup(TEST_PREFIX + "instructor1", Set.of(course.getTeachingAssistantGroupName()));
        changeUserGroup(TEST_PREFIX + "tutor1", Set.of(course.getTeachingAssistantGroupName(), "new-editor-group"));
        changeUserGroup(TEST_PREFIX + "tutor2", Set.of(course.getEditorGroupName()));

        jenkinsRequestMockProvider.mockUpdateCoursePermissions(course, oldInstructorGroup, course.getEditorGroupName(), course.getTeachingAssistantGroupName(), false, false);

        MvcResult result = request.performMvcRequest(courseTestService.buildUpdateCourse(course.getId(), course)).andExpect(status().isOk()).andReturn();
        course = objectMapper.readValue(result.getResponse().getContentAsString(), Course.class);

        assertThat(course.getInstructorGroupName()).isEqualTo("new-editor-group");
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testSetPermissionsForNewGroupMembersInCourse() throws Exception {
        Course course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise();
        String oldInstructorGroup = course.getInstructorGroupName();

        course.setInstructorGroupName("new-instructor-group");
        course.setEditorGroupName("new-editor-group");
        course.setTeachingAssistantGroupName("new-ta-group");

        // Create editor in the course
        User user = userUtilService.createAndSaveUser("new-editor");
        user.setGroups(Set.of("new-editor-group"));
        userTestRepository.save(user);

        user = userUtilService.createAndSaveUser("new-ta");
        user.setGroups(Set.of("new-ta-group"));
        userTestRepository.save(user);

        user = userUtilService.createAndSaveUser("new-instructor");
        user.setGroups(Set.of("new-instructor-group"));
        userTestRepository.save(user);

        jenkinsRequestMockProvider.mockUpdateCoursePermissions(course, oldInstructorGroup, course.getEditorGroupName(), course.getTeachingAssistantGroupName(), false, false);
        MvcResult result = request.performMvcRequest(courseTestService.buildUpdateCourse(course.getId(), course)).andExpect(status().isOk()).andReturn();
        course = objectMapper.readValue(result.getResponse().getContentAsString(), Course.class);

        assertThat(course.getInstructorGroupName()).isEqualTo("new-instructor-group");
        assertThat(course.getEditorGroupName()).isEqualTo("new-editor-group");
        assertThat(course.getTeachingAssistantGroupName()).isEqualTo("new-ta-group");
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testSetPermissionsForNewGroupMembersInCourseFails() throws Exception {
        Course course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise();
        course.setInstructorGroupName("new-instructor-group");

        // Create editor in the course
        User user = userUtilService.createAndSaveUser("new-editor");
        user.setGroups(Set.of("new-instructor-group"));
        userTestRepository.save(user);

        request.performMvcRequest(courseTestService.buildUpdateCourse(course.getId(), course)).andExpect(status().isInternalServerError()).andReturn();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testSetPermissionsForNewGroupMembersInCourseMemberDoesntExist() throws Exception {
        Course course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise();
        course.setInstructorGroupName("new-instructor-group");

        // Create editor in the course
        User user = userUtilService.createAndSaveUser("new-editor");
        user.setGroups(Set.of("new-instructor-group"));
        userTestRepository.save(user);

        request.performMvcRequest(courseTestService.buildUpdateCourse(course.getId(), course)).andExpect(status().isInternalServerError()).andReturn();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testFailToUpdateOldMembersInCourse() throws Exception {
        Course course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise();
        course.setInstructorGroupName("new-editor-group");

        changeUserGroup(TEST_PREFIX + "tutor1", Set.of(course.getTeachingAssistantGroupName()));

        var courseExercise = programmingExerciseRepository.findAllProgrammingExercisesInCourseOrInExamsOfCourse(course);
        var exercise = courseExercise.stream().findFirst();
        assertThat(exercise).isPresent();

        var user = userTestRepository.findAllWithGroupsAndAuthoritiesByIsDeletedIsFalseAndGroupsContains(course.getTeachingAssistantGroupName()).stream().findFirst();
        assertThat(user).isPresent();

        request.performMvcRequest(courseTestService.buildUpdateCourse(course.getId(), course)).andExpect(status().isInternalServerError());
    }

    /**
     * Changes the group of the user.
     *
     * @param userLogin the login of the user
     * @param groups    the groups to change
     */
    private void changeUserGroup(String userLogin, Set<String> groups) {
        Optional<User> user = userTestRepository.findOneWithGroupsByLogin(userLogin);
        assertThat(user).isPresent();

        User updatedUser = user.get();
        updatedUser.setGroups(groups);

        userTestRepository.save(updatedUser);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testUpdateCourseGroupsFailsToGetUser() throws Exception {
        Course course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise();
        course.setInstructorGroupName("new-instructor-group");

        Optional<User> user = userTestRepository.findOneWithGroupsByLogin(TEST_PREFIX + "instructor1");
        assertThat(user).isPresent();

        request.performMvcRequest(courseTestService.buildUpdateCourse(course.getId(), course)).andExpect(status().isInternalServerError()).andReturn();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testUpdateCourseGroupsFailsToRemoveOldMember() throws Exception {
        Course course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise();
        course.setInstructorGroupName("new-instructor-group");

        Optional<User> user = userTestRepository.findOneWithGroupsByLogin(TEST_PREFIX + "instructor1");
        assertThat(user).isPresent();

        var exercise = programmingExerciseRepository.findAllProgrammingExercisesInCourseOrInExamsOfCourse(course).stream().findFirst();
        assertThat(exercise).isPresent();

        request.performMvcRequest(courseTestService.buildUpdateCourse(course.getId(), course)).andExpect(status().isInternalServerError()).andReturn();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testUpdateCourseGroups_InExternalCiUserManagement_failToRemoveUser() throws Exception {
        courseTestService.testUpdateCourseGroups_InExternalCiUserManagement_failToRemoveUser();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testUpdateCourseGroups_InExternalCiUserManagement_failToAddUser() throws Exception {
        courseTestService.testUpdateCourseGroups_InExternalCiUserManagement_failToAddUser();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testGetCourseWithoutPermission() throws Exception {
        courseTestService.testGetCourseWithoutPermission();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor6", roles = "TA")
    void testGetCourse_tutorNotInCourse() throws Exception {
        courseTestService.testGetCourse_tutorNotInCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetCoursesWithPermission() throws Exception {
        courseTestService.testGetCoursesWithPermission();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetCoursesWithQuizExercises() throws Exception {
        courseTestService.testGetCoursesWithQuizExercises();
    }

    @ParameterizedTest(name = "{displayName} [{index}] {argumentsWithNames}")
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    @ValueSource(booleans = { true, false })
    void testGetCourseForDashboard(boolean userRefresh) throws Exception {
        courseTestService.testGetCourseForDashboard(userRefresh);
    }

    @ParameterizedTest(name = "{displayName} [{index}] {argumentsWithNames}")
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    @ValueSource(booleans = { true, false })
    void testGetCourseForDashboardAccessDenied(boolean userRefresh) throws Exception {
        courseTestService.testGetCourseForDashboardAccessDenied(userRefresh);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testGetCourseForDashboardForbiddenWithRegistrationPossible() throws Exception {
        courseTestService.testGetCourseForDashboardForbiddenWithEnrollmentPossible();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testGetCourseForRegistration() throws Exception {
        courseTestService.testGetCourseForEnrollment();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testGetCourseForRegistrationAccessDenied() throws Exception {
        courseTestService.testGetCourseForEnrollmentAccessDenied();
    }

    @ParameterizedTest(name = "{displayName} [{index}] {argumentsWithNames}")
    @WithMockUser(username = TEST_PREFIX + "custom1", roles = { "USER", "TA", "EDITOR", "INSTRUCTOR" })
    @ValueSource(booleans = { true, false })
    void testGetAllCoursesForDashboardExams(boolean userRefresh) throws Exception {
        courseTestService.testGetAllCoursesForDashboardExams(userRefresh);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testGetCoursesForDashboardPracticeRepositories() throws Exception {
        courseTestService.testGetCoursesForDashboardPracticeRepositories();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testGetAllCoursesForDashboard() throws Exception {
        courseTestService.testGetAllCoursesForDashboard();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetCoursesWithoutActiveExercises() throws Exception {
        courseTestService.testGetCoursesWithoutActiveExercises();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetCoursesAccurateTimezoneEvaluation() throws Exception {
        courseTestService.testGetCoursesAccurateTimezoneEvaluation();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetAllCoursesWithUserStats() throws Exception {
        courseTestService.testGetAllCoursesWithUserStats();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetCourseWithExercisesAndLecturesAndCompetencies() throws Exception {
        courseTestService.testGetCourseWithExercisesAndLecturesAndCompetencies();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetCourseWithOrganizations() throws Exception {
        courseTestService.testGetCourseWithOrganizations();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1")
    void testGetCoursesForEnrollmentAndAccurateTimeZoneEvaluation() throws Exception {
        courseTestService.testGetCoursesForEnrollmentAndAccurateTimeZoneEvaluation();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetCourseForAssessmentDashboardWithStats() throws Exception {
        courseTestService.testGetCourseForAssessmentDashboardWithStats();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetCourseForAssessmentDashboard_averageRatingComputedCorrectly() throws Exception {
        courseTestService.testGetCourseForAssessmentDashboard_averageRatingComputedCorrectly();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor2", roles = "INSTRUCTOR")
    void testGetCourseForInstructorDashboardWithStats_instructorNotInCourse() throws Exception {
        courseTestService.testGetCourseForInstructorDashboardWithStats_instructorNotInCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor6", roles = "TA")
    void testGetCourseForAssessmentDashboardWithStats_tutorNotInCourse() throws Exception {
        courseTestService.testGetCourseForAssessmentDashboardWithStats_tutorNotInCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetAssessmentDashboardStats_withoutAssessments() throws Exception {
        courseTestService.testGetAssessmentDashboardStats_withoutAssessments();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetAssessmentDashboardStats_withAssessments() throws Exception {
        courseTestService.testGetAssessmentDashboardStats_withAssessments();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetAssessmentDashboardStats_withAssessmentsAndComplaints() throws Exception {
        courseTestService.testGetAssessmentDashboardStats_withAssessmentsAndComplaints();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetAssessmentDashboardStats_withAssessmentsAndFeedbackRequests() throws Exception {
        courseTestService.testGetAssessmentDashboardStats_withAssessmentsAndFeedbackRequests();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetAssessmentDashboardStats_withAssessmentsAndComplaintsAndResponses() throws Exception {
        courseTestService.testGetAssessmentDashboardStats_withAssessmentsAndComplaintsAndResponses();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetAssessmentDashboardStats_withAssessmentsAndFeedBackRequestsAndResponses() throws Exception {
        courseTestService.testGetAssessmentDashboardStats_withAssessmentsAndFeedBackRequestsAndResponses();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetAssessmentDashboardStats_withAssessmentsAndComplaintsAndResponses_Large() throws Exception {
        courseTestService.testGetAssessmentDashboardStats_withAssessmentsAndComplaintsAndResponses_Large();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetCourse() throws Exception {
        courseTestService.testGetCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetCategoriesInCourse() throws Exception {
        courseTestService.testGetCategoriesInCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor2", roles = "INSTRUCTOR")
    void testGetCategoriesInCourse_instructorNotInCourse() throws Exception {
        courseTestService.testGetCategoriesInCourse_instructorNotInCourse();
    }

    @Test
    @WithMockUser(username = "ab12cde")
    void testEnrollInCourse() throws Exception {
        courseTestService.testEnrollInCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testUnenrollFromCourse() throws Exception {
        courseTestService.testUnenrollFromCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testAddTutorAndInstructorToCourse_failsToAddUserToGroup() throws Exception {
        courseTestService.testAddTutorAndEditorAndInstructorToCourse_failsToAddUserToGroup(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testRemoveTutorFromCourse_failsToRemoveUserFromGroup() throws Exception {
        courseTestService.testRemoveTutorFromCourse_failsToRemoveUserFromGroup();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testRemoveTutorFromCourse_removeUserGroupFails() throws Exception {
        Course course = CourseFactory.generateCourse(null, null, null, new HashSet<>(), "tumuser", "tutor", "editor", "instructor");
        course = courseRepository.save(course);
        programmingExerciseUtilService.addProgrammingExerciseToCourse(course);

        Optional<User> optionalTutor = userTestRepository.findOneWithGroupsByLogin(TEST_PREFIX + "tutor1");
        assertThat(optionalTutor).isPresent();

        User tutor = optionalTutor.get();

        request.delete("/api/core/courses/" + course.getId() + "/tutors/" + tutor.getLogin(), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    @WithMockUser(username = "ab12cde")
    void testEnrollInCourse_notMeetsDate() throws Exception {
        courseTestService.testEnrollInCourse_notMeetsDate();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testUpdateCourse_withExternalUserManagement_vcsUserManagementHasNotBeenCalled() throws Exception {
        var course = CourseFactory.generateCourse(1L, null, null, new HashSet<>(), "tumuser", "tutor", "editor", "instructor");
        course = courseRepository.save(course);

        request.performMvcRequest(courseTestService.buildUpdateCourse(1, course)).andExpect(status().isOk()).andReturn();

        verifyNoInteractions(versionControlService);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor2", roles = "INSTRUCTOR")
    void testUpdateCourse_instructorNotInCourse() throws Exception {
        courseTestService.testUpdateCourse_instructorNotInCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetAllStudentsOrTutorsOrInstructorsInCourse() throws Exception {
        courseTestService.testGetAllStudentsOrTutorsOrInstructorsInCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void searchForStudentsInCourse() throws Exception {
        courseTestService.searchStudentsInCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetAllEditorsInCourse() throws Exception {
        courseTestService.testGetAllEditorsInCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void searchUsersInCourse_searchForAllTutors_shouldReturnAllTutorsAndEditors() throws Exception {
        courseTestService.searchUsersInCourse_searchForAllTutors_shouldReturnAllTutorsAndEditors();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void searchUsersInCourse_searchForAllInstructor_shouldReturnAllInstructors() throws Exception {
        courseTestService.searchUsersInCourse_searchForAllInstructor_shouldReturnAllInstructors();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void searchUsersInCourse_searchForAllStudents_shouldReturnBadRequest() throws Exception {
        courseTestService.searchUsersInCourse_searchForAllStudents_shouldReturnBadRequest();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void searchUsersInCourse_searchForStudentsAndTooShortSearchTerm_shouldReturnBadRequest() throws Exception {
        courseTestService.searchUsersInCourse_searchForStudentsAndTooShortSearchTerm_shouldReturnBadRequest();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void searchUsersInCourse_searchForStudents_shouldReturnUsersMatchingSearchTerm() throws Exception {
        courseTestService.searchUsersInCourse_searchForStudents_shouldReturnUsersMatchingSearchTerm();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void searchUsersInCourse_searchForAllTutorsAndInstructors_shouldReturnAllTutorsEditorsAndInstructors() throws Exception {
        courseTestService.searchUsersInCourse_searchForAllTutorsAndInstructors_shouldReturnAllTutorsEditorsAndInstructors();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void searchUsersInCourse_searchForTutorsAndInstructors_shouldReturnUsersMatchingSearchTerm() throws Exception {
        courseTestService.searchUsersInCourse_searchForTutorsAndInstructors_shouldReturnUsersMatchingSearchTerm();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void searchUsersInCourse_searchForStudentsTutorsAndInstructorsAndTooShortSearchTerm_shouldReturnBadRequest() throws Exception {
        courseTestService.searchUsersInCourse_searchForStudentsTutorsAndInstructorsAndTooShortSearchTerm_shouldReturnBadRequest();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void searchUsersInCourse_searchForStudentsTutorsEditorsAndInstructors_shouldReturnUsersMatchingSearchTerm() throws Exception {
        courseTestService.searchUsersInCourse_searchForStudentsTutorsEditorsAndInstructors_shouldReturnUsersMatchingSearchTerm();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void searchMembersForUserMentionsSearchTermFilteringCorrect() throws Exception {
        courseTestService.testSearchMembersForUserMentionsSearchTermFilteringCorrect();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void searchMembersForUserMentionsSearchResultLimit() throws Exception {
        courseTestService.testSearchMembersForUserMentionsSearchResultLimit();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void tearchMembersForUserMentionsNoSearchTerm() throws Exception {
        courseTestService.testSearchMembersForUserMentionsNoSearchTerm();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetAllStudentsOrTutorsOrInstructorsInCourse_AsInstructorOfOtherCourse_forbidden() throws Exception {
        courseTestService.testGetAllStudentsOrTutorsOrInstructorsInCourse_AsInstructorOfOtherCourse_forbidden();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetAllStudentsOrTutorsOrInstructorsInCourse_AsTutor_forbidden() throws Exception {
        courseTestService.testGetAllStudentsOrTutorsOrInstructorsInCourse_AsTutor_forbidden();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testSearchStudentsAndTutorsAndInstructorsInCourse() throws Exception {
        courseTestService.testSearchStudentsAndTutorsAndInstructorsInCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testSearchStudentsAndTutorsAndInstructorsInOtherCourse_forbidden() throws Exception {
        courseTestService.testSearchStudentsAndTutorsAndInstructorsInOtherCourseForbidden();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testAddStudentOrTutorOrInstructorToCourse() throws Exception {
        learnerProfileUtilService.createLearnerProfilesForUsers(TEST_PREFIX);
        courseTestService.testAddStudentOrTutorOrEditorOrInstructorToCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testAddStudentOrTutorOrInstructorToCourse_AsInstructorOfOtherCourse_forbidden() throws Exception {
        courseTestService.testAddStudentOrTutorOrInstructorToCourse_AsInstructorOfOtherCourse_forbidden();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testAddStudentOrTutorOrInstructorToCourse_AsTutor_forbidden() throws Exception {
        courseTestService.testAddStudentOrTutorOrInstructorToCourse_AsTutor_forbidden();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testAddStudentOrTutorOrInstructorToCourse_WithNonExistingUser() throws Exception {
        courseTestService.testAddStudentOrTutorOrInstructorToCourse_WithNonExistingUser();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testRemoveStudentOrTutorOrInstructorFromCourse() throws Exception {
        courseTestService.testRemoveStudentOrTutorOrInstructorFromCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testRemoveStudentOrTutorOrInstructorFromCourse_WithNonExistingUser() throws Exception {
        courseTestService.testRemoveStudentOrTutorOrEditorOrInstructorFromCourse_WithNonExistingUser();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testRemoveStudentOrTutorOrInstructorFromCourse_AsInstructorOfOtherCourse_forbidden() throws Exception {
        courseTestService.testRemoveStudentOrTutorOrInstructorFromCourse_AsInstructorOfOtherCourse_forbidden();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testRemoveStudentOrTutorOrInstructorFromCourse_AsTutor_forbidden() throws Exception {
        courseTestService.testRemoveStudentOrTutorOrInstructorFromCourse_AsTutor_forbidden();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetLockedSubmissionsForCourseAsTutor() throws Exception {
        courseTestService.testGetLockedSubmissionsForCourseAsTutor();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testGetLockedSubmissionsForCourseAsStudent() throws Exception {
        courseTestService.testGetLockedSubmissionsForCourseAsStudent();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testArchiveCourseAsStudent_forbidden() throws Exception {
        courseTestService.testArchiveCourseAsStudent_forbidden();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testArchiveCourseAsTutor_forbidden() throws Exception {
        courseTestService.testArchiveCourseAsTutor_forbidden();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testArchiveCourseWithTestModelingAndFileUploadExercises() throws Exception {
        courseTestService.testArchiveCourseWithTestModelingAndFileUploadExercises();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testExportCourse_cannotCreateTmpDir() throws Exception {
        courseTestService.testExportCourse_cannotCreateTmpDir();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testExportCourse_cannotCreateCourseExercisesDir() throws Exception {
        courseTestService.testExportCourse_cannotCreateCourseExercisesDir();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testExportCourseExam_cannotCreateTmpDir() throws Exception {
        courseTestService.testExportCourseExam_cannotCreateTmpDir();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testExportCourseExam_cannotCreateExamExercisesDir() throws Exception {
        courseTestService.testExportCourseExam_cannotCreateExamsDir();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testDownloadCourseArchiveAsStudent_forbidden() throws Exception {
        courseTestService.testDownloadCourseArchiveAsStudent_forbidden();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testDownloadCourseArchiveAsTutor_forbidden() throws Exception {
        courseTestService.testDownloadCourseArchiveAsTutor_forbidden();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testDownloadCourseArchiveAsInstructor_not_found() throws Exception {
        courseTestService.testDownloadCourseArchiveAsInstructor_not_found();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testDownloadCourseArchiveAsInstructor() throws Exception {
        courseTestService.testDownloadCourseArchiveAsInstructor();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testCleanupCourseAsStudent_forbidden() throws Exception {
        courseTestService.testCleanupCourseAsStudent_forbidden();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testCleanupCourseAsTutor_forbidden() throws Exception {
        courseTestService.testCleanupCourseAsTutor_forbidden();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testCleanupCourseAsInstructor_no_Archive() throws Exception {
        courseTestService.testCleanupCourseAsInstructor_no_Archive();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testCleanupCourseAsInstructor() throws Exception {
        courseTestService.testCleanupCourseAsInstructor();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetCourseTitle() throws Exception {
        // Only user and role matter, so we can re-use the logic
        courseTestService.testGetCourseTitle();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetCourseTitleAsTeachingAssistant() throws Exception {
        // Only user and role matter, so we can re-use the logic
        courseTestService.testGetCourseTitle();
    }

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void testGetCourseTitleAsUser() throws Exception {
        // Only user and role matter, so we can re-use the logic
        courseTestService.testGetCourseTitle();
    }

    @Test
    @WithMockUser(username = "user1", roles = "USER")
    void testGetCourseTitleForNonExistingCourse() throws Exception {
        courseTestService.testGetCourseTitleForNonExistingCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetAllCoursesForManagementOverview() throws Exception {
        courseTestService.testGetAllCoursesForManagementOverview();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetExercisesForCourseOverview() throws Exception {
        courseTestService.testGetExercisesForCourseOverview();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetExerciseStatsForCourseOverview() throws Exception {
        courseTestService.testGetExerciseStatsForCourseOverview();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetExerciseStatsForCourseOverviewWithPastExercises() throws Exception {
        courseTestService.testGetExerciseStatsForCourseOverviewWithPastExercises();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetCourseManagementDetailData() throws Exception {
        courseTestService.testGetCourseManagementDetailData();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetCourseManagementDetailDataForFutureCourse() throws Exception {
        courseTestService.testGetCourseManagementDetailDataForFutureCourse();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testGetAllGroupsForAllCourses() throws Exception {
        courseTestService.testGetAllGroupsForAllCourses();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testAddUsersToCourseGroup() throws Exception {
        String group = "students";
        String registrationNumber1 = "1234567";
        String registrationNumber2 = "2345678";
        String email = "test@mail";
        courseTestService.testAddUsersToCourseGroup(group, registrationNumber1, registrationNumber2, email);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateCourseWithValidStartAndEndDate() throws Exception {
        courseTestService.testCreateCourseWithValidStartAndEndDate();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateCourseWithInvalidStartAndEndDate() throws Exception {
        courseTestService.testCreateCourseWithInvalidStartAndEndDate();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateInvalidOnlineCourse() throws Exception {
        courseTestService.testCreateInvalidOnlineCourse();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCreateValidOnlineCourse() throws Exception {
        courseTestService.testCreateValidOnlineCourse();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testUpdateToOnlineCourse() throws Exception {
        courseTestService.testUpdateToOnlineCourse();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testOnlineCourseConfigurationIsLazyLoaded() throws Exception {
        courseTestService.testOnlineCourseConfigurationIsLazyLoaded();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testUpdateOnlineCourseConfiguration() throws Exception {
        courseTestService.testUpdateOnlineCourseConfiguration();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testUpdateCourseRemoveOnlineCourseConfiguration() throws Exception {
        courseTestService.testUpdateCourseRemoveOnlineCourseConfiguration();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testDeleteCourseDeletesOnlineConfiguration() throws Exception {
        courseTestService.testDeleteCourseDeletesOnlineConfiguration();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testUpdateInvalidOnlineCourseConfiguration() throws Exception {
        courseTestService.testUpdateInvalidOnlineCourseConfiguration();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testUpdateValidOnlineCourseConfigurationAsStudent_forbidden() throws Exception {
        courseTestService.testUpdateValidOnlineCourseConfigurationAsStudent_forbidden();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testUpdateValidOnlineCourseConfigurationNotOnlineCourse() throws Exception {
        courseTestService.testUpdateValidOnlineCourseConfigurationNotOnlineCourse();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testUpdateValidOnlineCourseConfiguration_IdMismatch() throws Exception {
        courseTestService.testUpdateValidOnlineCourseConfiguration_IdMismatch();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testUpdateValidOnlineCourseConfiguration() throws Exception {
        courseTestService.testUpdateValidOnlineCourseConfiguration();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testEditCourseRemoveExistingIcon() throws Exception {
        courseTestService.testEditCourseRemoveExistingIcon();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "editor1", roles = "EDITOR")
    void testGetCoursesForImportWithoutPermission() throws Exception {
        courseTestService.testGetCoursesForImportWithoutPermission();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetCoursesForImport_asInstuctor() throws Exception {
        courseTestService.testGetCoursesForImport();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testGetCoursesForImport_asAdmin() throws Exception {
        courseTestService.testGetCoursesForImport();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testFindAllOnlineCoursesForLtiDashboard() throws Exception {
        courseTestService.testFindAllOnlineCoursesForLtiDashboard();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testGetAllCoursesForCourseArchiveWithNonNullSemesters() throws Exception {
        courseTestService.testGetAllCoursesForCourseArchiveWithNonNullSemestersAndEndDate();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testGetAllCoursesForCourseArchiveForUnenrolledStudent() throws Exception {
        courseTestService.testGetAllCoursesForCourseArchiveForUnenrolledStudent();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetExistingExerciseDetails_asTutor() throws Exception {
        courseTestService.testGetExistingExerciseDetails_asTutor();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "editor1", roles = "EDITOR")
    void testGetExistingExerciseDetails_asEditor() throws Exception {
        String username = TEST_PREFIX + "tutor1";
        courseTestService.testGetExistingExerciseDetails_asEditor(username);
    }
}
