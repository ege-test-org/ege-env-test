package de.tum.cit.aet.artemis.core;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import de.tum.cit.aet.artemis.assessment.domain.AssessmentType;
import de.tum.cit.aet.artemis.assessment.domain.GradingScale;
import de.tum.cit.aet.artemis.assessment.repository.GradingScaleRepository;
import de.tum.cit.aet.artemis.assessment.repository.ParticipantScoreRepository;
import de.tum.cit.aet.artemis.assessment.util.GradingScaleFactory;
import de.tum.cit.aet.artemis.communication.domain.AnswerPost;
import de.tum.cit.aet.artemis.communication.domain.Post;
import de.tum.cit.aet.artemis.communication.repository.AnswerPostRepository;
import de.tum.cit.aet.artemis.communication.test_repository.PostTestRepository;
import de.tum.cit.aet.artemis.core.domain.Course;
import de.tum.cit.aet.artemis.core.domain.GraphType;
import de.tum.cit.aet.artemis.core.domain.SpanType;
import de.tum.cit.aet.artemis.core.domain.StatisticsView;
import de.tum.cit.aet.artemis.core.domain.User;
import de.tum.cit.aet.artemis.core.dto.CourseManagementStatisticsDTO;
import de.tum.cit.aet.artemis.exercise.dto.ExerciseManagementStatisticsDTO;
import de.tum.cit.aet.artemis.exercise.participation.util.ParticipationUtilService;
import de.tum.cit.aet.artemis.exercise.test_repository.StudentParticipationTestRepository;
import de.tum.cit.aet.artemis.modeling.util.ModelingExerciseUtilService;
import de.tum.cit.aet.artemis.shared.base.AbstractSpringIntegrationIndependentTest;
import de.tum.cit.aet.artemis.text.domain.TextExercise;
import de.tum.cit.aet.artemis.text.domain.TextSubmission;
import de.tum.cit.aet.artemis.text.repository.TextExerciseRepository;
import de.tum.cit.aet.artemis.text.util.TextExerciseFactory;
import de.tum.cit.aet.artemis.text.util.TextExerciseUtilService;

class StatisticsIntegrationTest extends AbstractSpringIntegrationIndependentTest {

    private static final String TEST_PREFIX = "statisticsintegration";

    @Autowired
    private TextExerciseRepository textExerciseRepository;

    @Autowired
    private PostTestRepository postRepository;

    @Autowired
    private AnswerPostRepository answerPostRepository;

    @Autowired
    private ParticipantScoreRepository participantScoreRepository;

    @Autowired
    private GradingScaleRepository gradingScaleRepository;

    @Autowired
    private StudentParticipationTestRepository studentParticipationRepository;

    @Autowired
    private ModelingExerciseUtilService modelingExerciseUtilService;

    @Autowired
    private ParticipationUtilService participationUtilService;

    @Autowired
    private TextExerciseUtilService textExerciseUtilService;

    private Course course;

    private TextExercise exercise;

    private final List<GraphType> artemisGraphs = List.of(GraphType.SUBMISSIONS, GraphType.ACTIVE_USERS, GraphType.LOGGED_IN_USERS, GraphType.RELEASED_EXERCISES,
            GraphType.EXERCISES_DUE, GraphType.CONDUCTED_EXAMS, GraphType.EXAM_PARTICIPATIONS, GraphType.EXAM_REGISTRATIONS, GraphType.ACTIVE_TUTORS, GraphType.CREATED_RESULTS,
            GraphType.CREATED_FEEDBACKS);

    private final List<GraphType> courseGraphs = List.of(GraphType.SUBMISSIONS, GraphType.ACTIVE_USERS, GraphType.RELEASED_EXERCISES, GraphType.EXERCISES_DUE,
            GraphType.CONDUCTED_EXAMS, GraphType.EXAM_PARTICIPATIONS, GraphType.EXAM_REGISTRATIONS, GraphType.ACTIVE_TUTORS, GraphType.CREATED_RESULTS, GraphType.CREATED_FEEDBACKS,
            GraphType.POSTS, GraphType.RESOLVED_POSTS);

    private final List<GraphType> exerciseGraphs = List.of(GraphType.SUBMISSIONS, GraphType.ACTIVE_USERS, GraphType.ACTIVE_TUTORS, GraphType.CREATED_RESULTS,
            GraphType.CREATED_FEEDBACKS, GraphType.POSTS, GraphType.RESOLVED_POSTS);

    private static final int NUMBER_OF_STUDENTS = 5;

    @BeforeEach
    void initTestCase() {
        userUtilService.addUsers(TEST_PREFIX, NUMBER_OF_STUDENTS, 1, 0, 1);

        course = modelingExerciseUtilService.addCourseWithOneModelingExercise();
        var now = ZonedDateTime.now();
        exercise = TextExerciseFactory.generateTextExercise(now.minusDays(1), now.minusHours(2), now.plusHours(1), course);
        course.addExercises(exercise);
        textExerciseRepository.save(exercise);
        Post post = new Post();
        post.setConversation(exerciseUtilService.addChannelToExercise(exercise));
        post.setContent("Test Student Question 1");
        post.setVisibleForStudents(true);
        post.setCreationDate(ZonedDateTime.now().minusSeconds(11));
        post.setAuthor(userUtilService.getUserByLoginWithoutAuthorities(TEST_PREFIX + "student1"));
        postRepository.save(post);

        AnswerPost answerPost = new AnswerPost();
        answerPost.setAuthor(userUtilService.getUserByLoginWithoutAuthorities(TEST_PREFIX + "student1"));
        answerPost.setContent("Test Answer");
        answerPost.setCreationDate(ZonedDateTime.now().minusSeconds(10));
        answerPost.setPost(post);
        answerPostRepository.save(answerPost);

        // one submission today
        TextSubmission textSubmission = new TextSubmission();
        textSubmission.submissionDate(ZonedDateTime.now().minusSeconds(1));
        var submission = participationUtilService.addSubmission(exercise, textSubmission, TEST_PREFIX + "student1");
        participationUtilService.addResultToSubmission(submission, AssessmentType.MANUAL);

        for (int i = 2; i <= NUMBER_OF_STUDENTS; i++) {
            textSubmission = new TextSubmission();
            textSubmission.submissionDate(ZonedDateTime.now().minusMonths(i - 1).withDayOfMonth(10));
            submission = participationUtilService.addSubmission(exercise, textSubmission, TEST_PREFIX + "student" + i);
            participationUtilService.addResultToSubmission(submission, AssessmentType.MANUAL);
        }
    }

    @ParameterizedTest(name = "{displayName} [{index}] {argumentsWithNames}")
    @EnumSource(SpanType.class)
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testDataRangeEachGraph(SpanType span) throws Exception {
        int expectedResultLength = expectedResultLength(span);

        for (GraphType graph : artemisGraphs) {
            int periodIndex = 0;
            var parameters = buildParameters(span, periodIndex, graph);
            Integer[] result = request.get("/api/core/admin/management/statistics/data", HttpStatus.OK, Integer[].class, parameters);
            assertThat(result).hasSize(expectedResultLength);
        }
    }

    private int expectedResultLength(SpanType spanType) {
        return switch (spanType) {
            case DAY -> 24;
            case WEEK -> 7;
            case MONTH -> {
                ZonedDateTime now = ZonedDateTime.now();
                yield (int) ChronoUnit.DAYS.between(now.minusMonths(1), now);
            }
            case QUARTER, YEAR -> 12;
        };
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetChartDataForCourse() throws Exception {
        SpanType span = SpanType.WEEK;
        int periodIndex = 0;
        var view = StatisticsView.COURSE;
        var courseId = course.getId();
        for (GraphType graph : courseGraphs) {
            var parameters = buildParameters(span, periodIndex, graph, view, courseId);
            Integer[] result = request.get("/api/core/management/statistics/data-for-content", HttpStatus.OK, Integer[].class, parameters);
            assertThat(result).hasSize(7);
        }
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetChartDataForExercise() throws Exception {
        SpanType span = SpanType.WEEK;
        int periodIndex = 0;
        var view = StatisticsView.EXERCISE;
        var exerciseId = exercise.getId();
        for (GraphType graph : exerciseGraphs) {
            var parameters = buildParameters(span, periodIndex, graph, view, exerciseId);
            Integer[] result = request.get("/api/core/management/statistics/data-for-content", HttpStatus.OK, Integer[].class, parameters);
            assertThat(result).hasSize(7);
        }
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetCourseStatistics() throws Exception {
        ZonedDateTime pastTimestamp = ZonedDateTime.now().minusDays(5);
        TextExercise laterTextExercise = textExerciseUtilService.createIndividualTextExercise(course, pastTimestamp, pastTimestamp, pastTimestamp);
        TextExercise earlierTextExercise = textExerciseUtilService.createIndividualTextExercise(course, pastTimestamp.minusDays(1), pastTimestamp.minusDays(1),
                pastTimestamp.minusDays(1));

        GradingScale gradingScale = GradingScaleFactory.generateGradingScaleForCourse(course, 2, 20.0);
        gradingScaleRepository.save(gradingScale);

        var laterTextExerciseId = laterTextExercise.getId();
        var earlierTextExerciseId = earlierTextExercise.getId();
        User student1 = userTestRepository.findOneByLogin(TEST_PREFIX + "student1").orElseThrow();
        User student2 = userTestRepository.findOneByLogin(TEST_PREFIX + "student2").orElseThrow();

        // Creating result for student1 and student2 for the later exercise
        participationUtilService.createParticipationSubmissionAndResult(laterTextExerciseId, student1, 10.0, 0.0, 50, true);
        participationUtilService.createParticipationSubmissionAndResult(laterTextExerciseId, student2, 10.0, 0.0, 100, true);

        // Creating result for student1 and student2 for the earlier exercise
        participationUtilService.createParticipationSubmissionAndResult(earlierTextExerciseId, student1, 10.0, 0.0, 0, true);
        participationUtilService.createParticipationSubmissionAndResult(earlierTextExerciseId, student2, 10.0, 0.0, 80, true);

        await().until(() -> participantScoreRepository.findAllByExercise(laterTextExercise).size() == 2);
        await().until(() -> participantScoreRepository.findAllByExercise(earlierTextExercise).size() == 2);

        // Add presentation grades for student 1
        studentParticipationRepository.getAllParticipationsOfUserInExercises(student1, Set.of(laterTextExercise), false).forEach(participation -> {
            participation.setPresentationScore(100.0);
            studentParticipationRepository.save(participation);
        });

        Long courseId = course.getId();
        LinkedMultiValueMap<String, String> parameters = new LinkedMultiValueMap<>();
        parameters.add("courseId", "" + courseId);
        CourseManagementStatisticsDTO result = request.get("/api/core/management/statistics/course-statistics", HttpStatus.OK, CourseManagementStatisticsDTO.class, parameters);

        assertThat(result.averageScoreOfCourse()).isEqualTo(66.0);
        assertThat(result.averageScoresOfExercises()).hasSize(2);

        // take the second entry as the results are getting sorted for release dates
        var firstTextExerciseStatistics = result.averageScoresOfExercises().get(1);
        assertThat(firstTextExerciseStatistics.getAverageScore()).isEqualTo(75.0);
        assertThat(firstTextExerciseStatistics.getExerciseId()).isEqualTo(laterTextExerciseId);
        assertThat(firstTextExerciseStatistics.getExerciseName()).isEqualTo(laterTextExercise.getTitle());

        // take the first entry as the results are getting sorted for release dates
        var secondTextExerciseStatistics = result.averageScoresOfExercises().getFirst();
        assertThat(secondTextExerciseStatistics.getAverageScore()).isEqualTo(40.0);
        assertThat(secondTextExerciseStatistics.getExerciseId()).isEqualTo(earlierTextExerciseId);
        assertThat(secondTextExerciseStatistics.getExerciseName()).isEqualTo(earlierTextExercise.getTitle());
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetExerciseStatistics() throws Exception {
        ZonedDateTime pastTimestamp = ZonedDateTime.now().minusDays(5);
        TextExercise textExercise = textExerciseUtilService.createIndividualTextExercise(course, pastTimestamp, pastTimestamp, pastTimestamp);

        var firstTextExerciseId = textExercise.getId();
        User student1 = userTestRepository.findOneByLogin(TEST_PREFIX + "student1").orElseThrow();
        User student2 = userTestRepository.findOneByLogin(TEST_PREFIX + "student2").orElseThrow();

        // Creating result for student1 and student2 for firstExercise
        participationUtilService.createParticipationSubmissionAndResult(firstTextExerciseId, student1, 10.0, 0.0, 50, true);
        participationUtilService.createParticipationSubmissionAndResult(firstTextExerciseId, student2, 10.0, 0.0, 100, true);

        Post post = new Post();
        post.setConversation(exerciseUtilService.addChannelToExercise(textExercise));
        post.setContent("Test Student Question 1");
        post.setVisibleForStudents(true);
        post.setCreationDate(ZonedDateTime.now().minusHours(2));
        post.setAuthor(userUtilService.getUserByLoginWithoutAuthorities(TEST_PREFIX + "student1"));
        postRepository.save(post);

        AnswerPost answerPost = new AnswerPost();
        answerPost.setAuthor(userUtilService.getUserByLoginWithoutAuthorities(TEST_PREFIX + "student1"));
        answerPost.setContent("Test Answer");
        answerPost.setCreationDate(ZonedDateTime.now().minusHours(1));
        answerPost.setResolvesPost(true);
        answerPost.setPost(post);
        answerPostRepository.save(answerPost);

        await().until(() -> participantScoreRepository.findAllByExercise(textExercise).size() == 2);

        LinkedMultiValueMap<String, String> parameters = new LinkedMultiValueMap<>();
        parameters.add("exerciseId", "" + firstTextExerciseId);
        ExerciseManagementStatisticsDTO result = request.get("/api/core/management/statistics/exercise-statistics", HttpStatus.OK, ExerciseManagementStatisticsDTO.class,
                parameters);

        assertThat(result.averageScoreOfExercise()).isEqualTo(75.0);
        assertThat(result.maxPointsOfExercise()).isEqualTo(10);
        assertThat(result.numberOfExerciseScores()).isEqualTo(2);
        assertThat(result.numberOfParticipations()).isEqualTo(2);
        assertThat(result.numberOfStudentsOrTeamsInCourse()).isEqualTo(userTestRepository.countUserInGroup(course.getStudentGroupName()));
        assertThat(result.numberOfPosts()).isEqualTo(1);
        assertThat(result.numberOfResolvedPosts()).isEqualTo(1);
        var expectedScoresResult = new int[10];
        Arrays.fill(expectedScoresResult, 0);
        // We have one assessment with 50% and one with 100%
        expectedScoresResult[5] = 1;
        expectedScoresResult[9] = 1;
        assertThat(result.scoreDistribution()).isEqualTo(expectedScoresResult);
    }

    private MultiValueMap<String, String> buildParameters(SpanType span, Integer periodIndex, GraphType graph) {
        return buildParameters(span, periodIndex, graph, null, null);
    }

    private MultiValueMap<String, String> buildParameters(SpanType span, Integer periodIndex, GraphType graph, StatisticsView view, Long entityId) {
        final MultiValueMap<String, String> parameters = new LinkedMultiValueMap<>();

        parameters.add("span", span.toString());
        parameters.add("periodIndex", periodIndex.toString());
        parameters.add("graphType", graph.toString());
        if (view != null) {
            parameters.add("view", view.toString());
        }
        if (entityId != null) {
            parameters.add("entityId", entityId.toString());
        }

        return parameters;
    }
}
