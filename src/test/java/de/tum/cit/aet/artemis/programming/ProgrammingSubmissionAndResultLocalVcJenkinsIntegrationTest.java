package de.tum.cit.aet.artemis.programming;

import static de.tum.cit.aet.artemis.programming.domain.ProgrammingLanguage.JAVA;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.test.context.support.WithMockUser;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import de.tum.cit.aet.artemis.assessment.domain.Result;
import de.tum.cit.aet.artemis.core.domain.Course;
import de.tum.cit.aet.artemis.core.security.SecurityUtils;
import de.tum.cit.aet.artemis.programming.domain.ProgrammingExercise;
import de.tum.cit.aet.artemis.programming.domain.ProgrammingLanguage;
import de.tum.cit.aet.artemis.programming.domain.ProgrammingSubmission;
import de.tum.cit.aet.artemis.programming.domain.ProjectType;
import de.tum.cit.aet.artemis.programming.domain.build.BuildLogEntry;
import de.tum.cit.aet.artemis.programming.service.ci.notification.dto.CommitDTO;
import de.tum.cit.aet.artemis.programming.service.ci.notification.dto.TestCaseDTO;
import de.tum.cit.aet.artemis.programming.service.ci.notification.dto.TestCaseDetailMessageDTO;
import de.tum.cit.aet.artemis.programming.service.ci.notification.dto.TestResultsDTO;
import de.tum.cit.aet.artemis.programming.util.ProgrammingExerciseFactory;

class ProgrammingSubmissionAndResultLocalVcJenkinsIntegrationTest extends AbstractProgrammingIntegrationJenkinsLocalVcTest {

    private static final String TEST_PREFIX = "progsubreslocalvcjen";

    private ProgrammingExercise exercise;

    @BeforeEach
    void setUp() {
        jenkinsRequestMockProvider.enableMockingOfRequests(jenkinsJobPermissionsService);

        userUtilService.addUsers(TEST_PREFIX, 3, 2, 0, 2);
        var course = programmingExerciseUtilService.addCourseWithOneProgrammingExerciseAndTestCases();

        exercise = exerciseUtilService.getFirstExerciseWithType(course, ProgrammingExercise.class);
        exercise = programmingExerciseRepository.findWithEagerStudentParticipationsStudentAndLegalSubmissionsById(exercise.getId()).orElseThrow();

        participationUtilService.addStudentParticipationForProgrammingExercise(exercise, TEST_PREFIX + "student1");
        participationUtilService.addStudentParticipationForProgrammingExercise(exercise, TEST_PREFIX + "student2");

        exercise = programmingExerciseRepository.findWithEagerStudentParticipationsStudentAndLegalSubmissionsById(exercise.getId()).orElseThrow();
    }

    @AfterEach
    void tearDown() throws Exception {
        jenkinsRequestMockProvider.reset();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void shouldReceiveBuildLogsOnNewStudentParticipationResult() throws Exception {
        // Precondition: Database has participation and a programming submission.
        String userLogin = TEST_PREFIX + "student1";
        var course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise(false, ProgrammingLanguage.JAVA);
        var exercise = exerciseUtilService.getFirstExerciseWithType(course, ProgrammingExercise.class);
        exercise = programmingExerciseRepository.findWithEagerStudentParticipationsById(exercise.getId()).orElseThrow();

        var participation = participationUtilService.addStudentParticipationForProgrammingExercise(exercise, userLogin);
        var submission = programmingExerciseUtilService.createProgrammingSubmission(participation, false);

        List<String> logs = new ArrayList<>();
        logs.add("[2021-05-10T15:19:49.740Z] [ERROR] BubbleSort.java:[15,9] not a statement");
        logs.add("[2021-05-10T15:19:49.740Z] [ERROR] BubbleSort.java:[15,10] ';' expected");

        var notification = createJenkinsNewResultNotification(exercise.getProjectKey(), userLogin, ProgrammingLanguage.JAVA, List.of(), logs, null, new ArrayList<>());
        postResult(notification, HttpStatus.OK);

        var submissionWithLogsOptional = submissionRepository.findWithEagerBuildLogEntriesById(submission.getId());
        assertThat(submissionWithLogsOptional).isPresent();

        // Assert that the submission contains build log entries
        ProgrammingSubmission submissionWithLogs = submissionWithLogsOptional.get();
        List<BuildLogEntry> buildLogEntries = submissionWithLogs.getBuildLogEntries();
        assertThat(buildLogEntries).hasSize(2);
        assertThat(buildLogEntries.getFirst().getLog()).isEqualTo("[ERROR] BubbleSort.java:[15,9] not a statement");
        assertThat(buildLogEntries.get(1).getLog()).isEqualTo("[ERROR] BubbleSort.java:[15,10] ';' expected");
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void shouldExtractBuildLogAnalytics_noSca() throws Exception {
        // Precondition: Database has participation and a programming submission.
        String userLogin = TEST_PREFIX + "student1";
        Course course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise(false, ProgrammingLanguage.JAVA);
        ProgrammingExercise exercise = exerciseUtilService.getFirstExerciseWithType(course, ProgrammingExercise.class);
        exercise = programmingExerciseRepository.findWithEagerStudentParticipationsStudentAndLegalSubmissionsById(exercise.getId()).orElseThrow();
        var participation = participationUtilService.addStudentParticipationForProgrammingExercise(exercise, userLogin);
        programmingExerciseUtilService.createProgrammingSubmission(participation, false);

        final var logs = getLogs("[2021-05-10T15:00:10.000Z] Dependency 1 Downloaded from", "[2021-05-10T15:00:20.000Z] Everything finished");

        var notification = createJenkinsNewResultNotification(exercise.getProjectKey(), userLogin, ProgrammingLanguage.JAVA, List.of(), logs, null, new ArrayList<>());
        postResult(notification, HttpStatus.OK);

        var statistics = buildLogStatisticsEntryRepository.findAverageBuildLogStatistics(exercise);
        assertThat(statistics.buildCount()).isEqualTo(1);
        assertThat(statistics.agentSetupDuration()).isEqualTo(90);
        assertThat(statistics.testDuration()).isEqualTo(10);
        assertThat(statistics.scaDuration()).isEqualTo(0.0);
        assertThat(statistics.totalJobDuration()).isEqualTo(110);
        assertThat(statistics.dependenciesDownloadedCount()).isEqualTo(1);
    }

    private static List<String> getLogs(String dependencyDownloaded, String jobFinished) {
        List<String> logs = new ArrayList<>();
        logs.add("[2021-05-10T14:58:30.000Z] Agents is getting prepared");
        logs.add("[2021-05-10T15:00:00.000Z] docker exec"); // Job started
        logs.add("[2021-05-10T15:00:05.000Z] Scanning for projects..."); // Build & test started
        logs.add(dependencyDownloaded);
        logs.add("[2021-05-10T15:00:15.000Z] Total time: Some time"); // Build & test finished
        logs.add(jobFinished); // Job finished
        return logs;
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void shouldExtractBuildLogAnalytics_noSca_gradle() throws Exception {
        // Precondition: Database has participation and a programming submission.
        String userLogin = TEST_PREFIX + "student1";
        Course course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise(false, ProgrammingLanguage.JAVA);
        ProgrammingExercise exercise = exerciseUtilService.getFirstExerciseWithType(course, ProgrammingExercise.class);
        exercise = programmingExerciseRepository.findWithEagerStudentParticipationsStudentAndLegalSubmissionsById(exercise.getId()).orElseThrow();
        exercise.setProjectType(ProjectType.GRADLE_GRADLE);
        programmingExerciseBuildConfigRepository.save(exercise.getBuildConfig());
        programmingExerciseRepository.save(exercise);
        var participation = participationUtilService.addStudentParticipationForProgrammingExercise(exercise, userLogin);
        programmingExerciseUtilService.createProgrammingSubmission(participation, false);

        List<String> logs = new ArrayList<>();
        logs.add("[2021-05-10T15:00:00.000Z] Starting a Gradle Daemon"); // Job started
        logs.add("[2021-05-10T15:00:20.000Z] BUILD SUCCESSFUL in 20 seconds"); // Build & test started

        var notification = createJenkinsNewResultNotification(exercise.getProjectKey(), userLogin, ProgrammingLanguage.JAVA, List.of(), logs, null, new ArrayList<>());
        postResult(notification, HttpStatus.OK);

        var statistics = buildLogStatisticsEntryRepository.findAverageBuildLogStatistics(exercise);
        assertThat(statistics.buildCount()).isEqualTo(1);
        assertThat(statistics.agentSetupDuration()).isEqualTo(0.0);
        assertThat(statistics.testDuration()).isEqualTo(20);
        assertThat(statistics.scaDuration()).isEqualTo(0.0);
        assertThat(statistics.totalJobDuration()).isEqualTo(20);
        assertThat(statistics.dependenciesDownloadedCount()).isEqualTo(0.0);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void shouldExtractBuildLogAnalytics_sca() throws Exception {
        // Precondition: Database has participation and a programming submission.
        String userLogin = TEST_PREFIX + "student1";
        Course course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise(false, ProgrammingLanguage.JAVA);
        ProgrammingExercise exercise = exerciseUtilService.getFirstExerciseWithType(course, ProgrammingExercise.class);
        exercise = programmingExerciseRepository.findWithEagerStudentParticipationsStudentAndLegalSubmissionsById(exercise.getId()).orElseThrow();
        var participation = participationUtilService.addStudentParticipationForProgrammingExercise(exercise, userLogin);
        programmingExerciseUtilService.createProgrammingSubmission(participation, false);

        final var logs = getLogs("[2021-05-10T15:00:20.000Z] Dependency 1 Downloaded from", "[2021-05-10T15:00:16.000Z] Scanning for projects...");
        logs.add("[2021-05-10T15:00:20.000Z] Dependency 2 Downloaded from");
        logs.add("[2021-05-10T15:00:27.000Z] Total time: Some time"); // SCA finished
        logs.add("[2021-05-10T15:00:30.000Z] Everything finished"); // Job finished

        var notification = createJenkinsNewResultNotification(exercise.getProjectKey(), userLogin, ProgrammingLanguage.JAVA, List.of(), logs, null, new ArrayList<>());
        postResult(notification, HttpStatus.OK);

        var statistics = buildLogStatisticsEntryRepository.findAverageBuildLogStatistics(exercise);
        assertThat(statistics.buildCount()).isEqualTo(1);
        assertThat(statistics.agentSetupDuration()).isEqualTo(90);
        assertThat(statistics.testDuration()).isEqualTo(10);
        assertThat(statistics.scaDuration()).isEqualTo(11);
        assertThat(statistics.totalJobDuration()).isEqualTo(120);
        assertThat(statistics.dependenciesDownloadedCount()).isEqualTo(2);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void shouldExtractBuildLogAnalytics_unsupportedProgrammingLanguage() throws Exception {
        // Precondition: Database has participation and a programming submission.
        String userLogin = TEST_PREFIX + "student1";
        var course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise(false, ProgrammingLanguage.PYTHON);
        var exercise = exerciseUtilService.getFirstExerciseWithType(course, ProgrammingExercise.class);
        var participation = participationUtilService.addStudentParticipationForProgrammingExercise(exercise, userLogin);
        programmingExerciseUtilService.createProgrammingSubmission(participation, false);

        final var logs = getLogs("[2021-05-10T15:00:20.000Z] Dependency 1 Downloaded from", "[2021-05-10T15:00:20.000Z] Everything finished");

        var notification = createJenkinsNewResultNotification(exercise.getProjectKey(), userLogin, ProgrammingLanguage.PYTHON, List.of(), logs, null, new ArrayList<>());
        postResult(notification, HttpStatus.OK);

        var statistics = buildLogStatisticsEntryRepository.findAverageBuildLogStatistics(exercise);
        // Should not extract any statistics
        assertThat(statistics.buildCount()).isZero();
        assertThat(statistics.agentSetupDuration()).isEqualTo(0.0);
        assertThat(statistics.testDuration()).isEqualTo(0.0);
        assertThat(statistics.scaDuration()).isEqualTo(0.0);
        assertThat(statistics.totalJobDuration()).isEqualTo(0.0);
        assertThat(statistics.dependenciesDownloadedCount()).isEqualTo(0.0);
    }

    private static Stream<Arguments> shouldSaveBuildLogsOnStudentParticipationArguments() {
        return ProgrammingLanguage.getEnabledLanguages().stream()
                .flatMap(programmingLanguage -> Stream.of(Arguments.of(programmingLanguage, true), Arguments.of(programmingLanguage, false)));
    }

    @ParameterizedTest(name = "{displayName} [{index}] {argumentsWithNames}")
    @MethodSource("shouldSaveBuildLogsOnStudentParticipationArguments")
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void shouldReturnBadRequestWhenPlanKeyDoesntExist(ProgrammingLanguage programmingLanguage, boolean enableStaticCodeAnalysis) throws Exception {
        // Precondition: Database has participation and a programming submission.
        String userLogin = TEST_PREFIX + "student1";
        var course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise(enableStaticCodeAnalysis, programmingLanguage);
        exercise = exerciseUtilService.getFirstExerciseWithType(course, ProgrammingExercise.class);
        exercise = programmingExerciseRepository.findWithEagerStudentParticipationsById(exercise.getId()).orElseThrow();

        var participation = participationUtilService.addStudentParticipationForProgrammingExercise(exercise, userLogin);

        // Call programming-exercises/new-result which do not include build log entries yet
        var notification = createJenkinsNewResultNotification("scrambled build plan key", userLogin, programmingLanguage, List.of(), new ArrayList<>(), null, new ArrayList<>());
        postResult(notification, HttpStatus.BAD_REQUEST);

        var results = resultRepository.findAllByParticipationIdOrderByCompletionDateDesc(participation.getId());
        assertThat(results).isEmpty();
    }

    private final List<String> logs = List.of("[2023-03-10T15:19:49.741Z] [ERROR] Log1", "[2023-03-10T15:19:49.742Z] [ERROR] Log2", "[2023-03-10T15:19:49.743Z] [ERROR] Log3");

    private static Stream<Arguments> shouldSaveBuildLogsOnStudentParticipationWithoutResultArguments() {
        return ProgrammingLanguage.getEnabledLanguages().stream().flatMap(programmingLanguage -> Stream.of(Arguments.of(programmingLanguage, true, true),
                Arguments.of(programmingLanguage, false, true), Arguments.of(programmingLanguage, true, false), Arguments.of(programmingLanguage, false, false)));
    }

    @ParameterizedTest(name = "{displayName} [{index}] {argumentsWithNames}")
    @MethodSource("shouldSaveBuildLogsOnStudentParticipationWithoutResultArguments")
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void shouldSaveBuildLogsOnStudentParticipationWithoutResult(ProgrammingLanguage programmingLanguage, boolean enableStaticCodeAnalysis, boolean buildFailed) throws Exception {
        // Precondition: Database has participation and a programming submission.
        String userLogin = TEST_PREFIX + "student1";
        var course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise(enableStaticCodeAnalysis, programmingLanguage);
        exercise = exerciseUtilService.getFirstExerciseWithType(course, ProgrammingExercise.class);
        exercise = programmingExerciseRepository.findWithEagerStudentParticipationsById(exercise.getId()).orElseThrow();

        var participation = participationUtilService.addStudentParticipationForProgrammingExercise(exercise, userLogin);
        // It should not matter whether the submission has buildFailed set to true or false, because when the result is processed after sending it to Artemis, buildFailed is set to
        // true anyway if no feedback is provided with the result.
        var submission = programmingExerciseUtilService.createProgrammingSubmission(participation, buildFailed);

        // Call programming-exercises/new-result which does include build log entries
        var notification = createJenkinsNewResultNotification(exercise.getProjectKey(), userLogin, programmingLanguage, List.of(), logs, null, new ArrayList<>());
        postResult(notification, HttpStatus.OK);

        var result = assertBuildError(participation.getId(), userLogin);
        assertThat(result.getSubmission().getId()).isEqualTo(submission.getId());

        // Call again and assert that no new submissions have been created
        postResult(notification, HttpStatus.OK);
        assertNoNewSubmissions(participation.getId(), submission);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void shouldCreateGradleFeedback() throws Exception {
        String userLogin = TEST_PREFIX + "student1";
        var course = programmingExerciseUtilService.addCourseWithOneProgrammingExercise(false, JAVA);
        exercise = exerciseUtilService.getFirstExerciseWithType(course, ProgrammingExercise.class);
        exercise.setProjectType(ProjectType.GRADLE_GRADLE);
        exercise = programmingExerciseRepository.save(exercise);

        var participation = participationUtilService.addStudentParticipationForProgrammingExercise(exercise, userLogin);
        programmingExerciseUtilService.createProgrammingSubmission(participation, false);

        var notification = createJenkinsNewResultNotification(exercise.getProjectKey(), userLogin, JAVA, List.of(), List.of("test1"), logs, null, new ArrayList<>());

        var longErrorMessage = new TestCaseDetailMessageDTO("abc\nmultiline\nfeedback");
        var testCase = new TestCaseDTO("test1", "Class", 0d, new ArrayList<>(), List.of(longErrorMessage), new ArrayList<>());
        notification.results().getFirst().testCases().set(0, testCase);

        postResult(notification, HttpStatus.OK);

        var result = resultRepository.findFirstWithFeedbacksByParticipationIdOrderByCompletionDateDescElseThrow(participation.getId());
        // Jenkins Setup -> Gradle Feedback is not duplicated and should be kept like this
        assertThat(result.getFeedbacks().getFirst().getDetailText()).isEqualTo("abc\nmultiline\nfeedback");
    }

    private Result assertBuildError(Long participationId, String userLogin) throws Exception {
        SecurityUtils.setAuthorizationObject();
        // Assert that result is linked to the participation
        var results = resultRepository.findAllByParticipationIdOrderByCompletionDateDesc(participationId);
        assertThat(results).hasSize(1);
        var result = results.getFirst();
        assertThat(result.isSuccessful()).isFalse();
        assertThat(result.getScore()).isZero();

        // Assert that the submission is linked to the participation
        var submission = (ProgrammingSubmission) result.getSubmission();
        assertThat(submission).isNotNull();
        assertThat(submission.isBuildFailed()).isTrue();

        var submissionWithLogsOptional = submissionRepository.findWithEagerBuildLogEntriesById(submission.getId());
        assertThat(submissionWithLogsOptional).isPresent();
        assertThat(submissionWithLogsOptional.get().getBuildLogEntries()).hasSize(3);

        userUtilService.changeUser(userLogin);
        // Assert that the build logs can be retrieved from the REST API from the database
        var receivedLogs = request.get("/api/programming/repository/" + participationId + "/buildlogs", HttpStatus.OK, List.class);
        assertThat(receivedLogs).isNotNull().isNotEmpty();

        return result;
    }

    private void assertNoNewSubmissions(long participationId, ProgrammingSubmission existingSubmission) {
        var updatedSubmissions = submissionRepository.findAllByParticipationIdWithResults(participationId);
        assertThat(updatedSubmissions).hasSize(1);
        assertThat(updatedSubmissions.getFirst().getId()).isEqualTo(existingSubmission.getId());
    }

    private void postResult(TestResultsDTO requestBodyMap, HttpStatus status) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        final var alteredObj = mapper.convertValue(requestBodyMap, Object.class);

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add("Authorization", ARTEMIS_AUTHENTICATION_TOKEN_VALUE);
        request.postWithoutLocation("/api/assessment/public/programming-exercises/new-result", alteredObj, status, httpHeaders);
    }

    private TestResultsDTO createJenkinsNewResultNotification(String projectKey, String loginName, ProgrammingLanguage programmingLanguage, List<String> successfulTests,
            List<String> logs, ZonedDateTime buildRunDate, List<CommitDTO> commits) {
        return createJenkinsNewResultNotification(projectKey, loginName, programmingLanguage, successfulTests, List.of(), logs, buildRunDate, commits);
    }

    private TestResultsDTO createJenkinsNewResultNotification(String projectKey, String loginName, ProgrammingLanguage programmingLanguage, List<String> successfulTests,
            List<String> failedTests, List<String> logs, ZonedDateTime buildRunDate, List<CommitDTO> commits) {
        var repoName = (projectKey + "-" + loginName).toUpperCase();
        // The full name is specified as <FOLDER NAME> » <JOB NAME> <Build Number>
        var fullName = exercise.getProjectKey() + " » " + repoName + " #3";
        return ProgrammingExerciseFactory.generateTestResultDTO(fullName, repoName, buildRunDate, programmingLanguage, false, successfulTests, failedTests, logs, commits, null);
    }

}
