package de.tum.cit.aet.artemis.atlas.competency;

import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.http.HttpStatus;
import org.springframework.security.test.context.support.WithMockUser;

import de.tum.cit.aet.artemis.atlas.domain.competency.CourseCompetency;
import de.tum.cit.aet.artemis.atlas.domain.competency.Prerequisite;
import de.tum.cit.aet.artemis.atlas.dto.CompetencyImportOptionsDTO;
import de.tum.cit.aet.artemis.atlas.dto.CompetencyImportResponseDTO;
import de.tum.cit.aet.artemis.atlas.dto.CompetencyWithTailRelationDTO;
import de.tum.cit.aet.artemis.exercise.domain.IncludedInOverallScore;

class PrerequisiteIntegrationTest extends AbstractCompetencyPrerequisiteIntegrationTest {

    private static final String TEST_PREFIX = "prerequisiteintegrationtest";

    @BeforeEach
    void setupTestScenario() {
        super.setupTestScenario(TEST_PREFIX, prerequisiteUtilService::createPrerequisite);
    }

    @Nested
    class PreAuthorize {

        private void testAllPreAuthorizeEditor() throws Exception {
            request.post("/api/atlas/courses/" + course.getId() + "/prerequisites/import/bulk", new CompetencyImportOptionsDTO(null, null, false, false, false, null, false),
                    HttpStatus.FORBIDDEN);
            request.post("/api/atlas/courses/" + course.getId() + "/prerequisites/import-standardized", Collections.emptyList(), HttpStatus.FORBIDDEN);
        }

        private void testAllPreAuthorizeInstructor() throws Exception {
            request.put("/api/atlas/courses/" + course.getId() + "/prerequisites", new Prerequisite(), HttpStatus.FORBIDDEN);
            request.post("/api/atlas/courses/" + course.getId() + "/prerequisites", new Prerequisite(), HttpStatus.FORBIDDEN);
            request.delete("/api/atlas/courses/" + course.getId() + "/prerequisites/" + courseCompetency.getId(), HttpStatus.FORBIDDEN);
            request.post("/api/atlas/courses/" + course.getId() + "/prerequisites/bulk", Collections.emptyList(), HttpStatus.FORBIDDEN);
            // import
            request.post("/api/atlas/courses/" + course.getId() + "/prerequisites/import-all", new CompetencyImportOptionsDTO(null, null, false, false, false, null, false),
                    HttpStatus.FORBIDDEN);
            request.post("/api/atlas/courses/" + course.getId() + "/prerequisites/import", new CompetencyImportOptionsDTO(null, null, false, false, false, null, false),
                    HttpStatus.FORBIDDEN);
        }

        @Test
        @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
        void shouldFailAsTutor() throws Exception {
            this.testAllPreAuthorizeInstructor();
            this.testAllPreAuthorizeEditor();
        }

        @Test
        @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
        void shouldFailAsStudent() throws Exception {
            this.testAllPreAuthorizeInstructor();
            this.testAllPreAuthorizeEditor();
        }

        @Test
        @WithMockUser(username = TEST_PREFIX + "editor1", roles = "EDITOR")
        void shouldFailAsEditor() throws Exception {
            this.testAllPreAuthorizeInstructor();
            // do not call testAllPreAuthorizeEditor, as these methods should succeed
        }
    }

    Prerequisite getCall(long courseId, long competencyId, HttpStatus expectedStatus) throws Exception {
        return request.get("/api/atlas/courses/" + courseId + "/prerequisites/" + competencyId, expectedStatus, Prerequisite.class);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void shouldReturnCompetencyForStudent() throws Exception {
        super.shouldReturnCompetencyForStudent();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testShouldOnlySendUserSpecificData() throws Exception {
        super.testShouldOnlySendUserSpecificData(TEST_PREFIX);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor42", roles = "INSTRUCTOR")
    void shouldReturnForbiddenForUserNotInCourse() throws Exception {
        super.shouldReturnForbiddenForUserNotInCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void shouldReturnBadRequestForWrongCourse() throws Exception {
        super.shouldReturnBadRequestForWrongCourse();
    }

    @Override
    List<? extends CourseCompetency> getAllCall(long courseId, HttpStatus expectedStatus) throws Exception {
        return request.getList("/api/atlas/courses/" + courseId + "/prerequisites", expectedStatus, Prerequisite.class);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void shouldReturnCompetenciesForStudentOfCourse() throws Exception {
        super.shouldReturnCompetenciesForCourse(new Prerequisite());
    }

    @Override
    List<? extends CourseCompetency> getAllFilteredCall(long courseId, HttpStatus expectedStatus) throws Exception {
        throw new UnsupportedOperationException("Not implemented for prerequisites");
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student42", roles = "USER")
    void shouldReturnCompetenciesForStudentNotInCourse() throws Exception {
        super.shouldReturnCompetenciesForCourse(new Prerequisite());
    }

    void deleteCall(long courseId, long competencyId, HttpStatus expectedStatus) throws Exception {
        request.delete("/api/atlas/courses/" + courseId + "/prerequisites/" + competencyId, expectedStatus);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldDeleteCompetencyWhenInstructor() throws Exception {
        super.shouldDeleteCompetencyWhenInstructor();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldDeleteCompetencyAndRelations() throws Exception {
        super.shouldDeleteCompetencyAndRelations(prerequisiteUtilService.createPrerequisite(course));
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor42", roles = "INSTRUCTOR")
    void shouldReturnForbiddenForInstructorOfOtherCourseForDelete() throws Exception {
        super.shouldReturnForbiddenForInstructorOfOtherCourseForDelete();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void deleteCourseShouldAlsoDeleteCompetencyAndRelations() throws Exception {
        super.deleteCourseShouldAlsoDeleteCompetencyAndRelations(prerequisiteUtilService.createPrerequisite(course));
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void deleteLectureShouldUpdateCompetency() throws Exception {
        super.deleteLectureShouldUpdateCompetency();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void deleteLectureUnitShouldUpdateCompetency() throws Exception {
        super.deleteLectureUnitShouldUpdateCompetency();
    }

    CourseCompetency updateCall(long courseId, CourseCompetency competency, HttpStatus expectedStatus) throws Exception {
        return request.putWithResponseBody("/api/atlas/courses/" + courseId + "/prerequisites", competency, Prerequisite.class, expectedStatus);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldUpdateCompetency() throws Exception {
        super.shouldUpdateCompetency();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldReturnBadRequestForCompetencyWithoutId() throws Exception {
        super.shouldReturnBadRequestForCompetencyWithoutId();
    }

    @ParameterizedTest(name = "{displayName} [{index}] {argumentsWithNames}")
    @EnumSource(IncludedInOverallScore.class)
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldUpdateCompetencyToOptionalWhenSettingOptional(IncludedInOverallScore includedInOverallScore) throws Exception {
        super.shouldUpdateCompetencyToOptionalWhenSettingOptional(new Prerequisite(), includedInOverallScore);
    }

    CourseCompetency createCall(long courseId, CourseCompetency competency, HttpStatus expectedStatus) throws Exception {
        return request.postWithResponseBody("/api/atlas/courses/" + courseId + "/prerequisites", competency, Prerequisite.class, expectedStatus);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldCreateValidCompetency() throws Exception {
        super.shouldCreateValidCompetency(new Prerequisite());
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void forCompetencyWithNoTitleForCreate() throws Exception {
        super.forCompetencyWithNoTitleForCreate(new Prerequisite());
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void forCompetencyWithEmptyTitleForCreate() throws Exception {
        super.forCompetencyWithEmptyTitleForCreate(new Prerequisite());
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void forCompetencyWithIdForCreate() throws Exception {
        super.forCompetencyWithIdForCreate(new Prerequisite());
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor42", roles = "INSTRUCTOR")
    void shouldReturnForbiddenForInstructorOfOtherCourseForCreate() throws Exception {
        super.shouldReturnForbiddenForInstructorOfOtherCourseForCreate(new Prerequisite());
    }

    CourseCompetency importCall(long courseId, CompetencyImportOptionsDTO importOptions, HttpStatus expectedStatus) throws Exception {
        return request.postWithResponseBody("/api/atlas/courses/" + courseId + "/prerequisites/import", importOptions, Prerequisite.class, expectedStatus);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldImportCompetency() throws Exception {
        super.shouldImportCompetency();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldImportExerciseAndLectureWithCompetency() throws Exception {
        super.shouldImportExerciseAndLectureWithCompetency();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor42", roles = "INSTRUCTOR")
    void shouldReturnForbiddenForInstructorOfOtherCourseForImport() throws Exception {
        super.shouldReturnForbiddenForInstructorOfOtherCourseForImport();
    }

    List<? extends CourseCompetency> createBulkCall(long courseId, List<? extends CourseCompetency> competencies, HttpStatus expectedStatus) throws Exception {
        return request.postListWithResponseBody("/api/atlas/courses/" + courseId + "/prerequisites/bulk", competencies, Prerequisite.class, expectedStatus);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldCreateCompetencies() throws Exception {
        super.shouldCreateCompetencies(new Prerequisite(), new Prerequisite());
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void forCompetencyWithNoTitle() throws Exception {
        super.forCompetencyWithNoTitle(new Prerequisite());
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void forCompetencyWithEmptyTitle() throws Exception {
        super.forCompetencyWithEmptyTitle(new Prerequisite());
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void forCompetencyWithId() throws Exception {
        super.forCompetencyWithId(new Prerequisite());
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor42", roles = "INSTRUCTOR")
    void shouldReturnForbiddenForInstructorOfOtherCourseForCreateBulk() throws Exception {
        super.shouldReturnForbiddenForInstructorOfOtherCourseForCreateBulk();
    }

    List<CompetencyWithTailRelationDTO> importAllCall(long courseId, CompetencyImportOptionsDTO importOptions, HttpStatus expectedStatus) throws Exception {
        return request.postListWithResponseBody("/api/atlas/courses/" + courseId + "/prerequisites/import-all", importOptions, CompetencyWithTailRelationDTO.class, expectedStatus);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldImportAllCompetencies() throws Exception {
        super.shouldImportAllCompetencies(prerequisiteUtilService::createPrerequisite);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldImportAllCompetenciesWithSomeExisting() throws Exception {
        shouldImportAllCompetenciesWithSomeExisting(Prerequisite::new, 3);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldImportAllExerciseAndLectureWithCompetency() throws Exception {
        super.shouldImportAllExerciseAndLectureWithCompetency();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldImportAllExerciseAndLectureWithCompetencyAndChangeDates() throws Exception {
        super.shouldImportAllExerciseAndLectureWithCompetencyAndChangeDates();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor42", roles = "INSTRUCTOR")
    void shouldReturnForbiddenForInstructorNotInCourse() throws Exception {
        super.shouldReturnForbiddenForInstructorNotInCourse();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldReturnBadRequestForImportFromSameCourse() throws Exception {
        super.shouldReturnBadRequestForImportFromSameCourse();
    }

    List<CompetencyImportResponseDTO> importStandardizedCall(long courseId, List<Long> idList, HttpStatus expectedStatus) throws Exception {
        return request.postListWithResponseBody("/api/atlas/courses/" + courseId + "/prerequisites/import-standardized", idList, CompetencyImportResponseDTO.class, expectedStatus);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "editor1", roles = "EDITOR")
    void shouldImportStandardizedCompetencies() throws Exception {
        super.shouldImportStandardizedCompetencies();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "editor1", roles = "EDITOR")
    void shouldReturnNotFoundForNotExistingIds() throws Exception {
        super.shouldReturnNotFoundForNotExistingIds();
    }

    List<CompetencyWithTailRelationDTO> importBulkCall(long courseId, CompetencyImportOptionsDTO importOptions, HttpStatus expectedStatus) throws Exception {
        return request.postListWithResponseBody("/api/atlas/courses/" + courseId + "/prerequisites/import/bulk", importOptions, CompetencyWithTailRelationDTO.class,
                expectedStatus);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor42", roles = "INSTRUCTOR")
    void shouldReturnForbiddenForInstructorOfOtherCourseForBulkImport() throws Exception {
        super.shouldReturnForbiddenForInstructorOfOtherCourseForBulkImport();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldImportCompetencies() throws Exception {
        super.shouldImportCompetencies(prerequisiteUtilService::createPrerequisite);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldImportCompetenciesExerciseAndLectureWithCompetency() throws Exception {
        super.shouldImportCompetenciesExerciseAndLectureWithCompetency();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void shouldImportCompetenciesExerciseAndLectureWithCompetencyAndChangeDates() throws Exception {
        super.shouldImportCompetenciesExerciseAndLectureWithCompetencyAndChangeDates();
    }
}
