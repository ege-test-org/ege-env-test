package de.tum.cit.aet.artemis.modeling;

import static de.tum.cit.aet.artemis.core.util.TestResourceUtils.HalfSecond;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ArgumentsSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.util.LinkedMultiValueMap;

import de.tum.cit.aet.artemis.assessment.domain.AssessmentType;
import de.tum.cit.aet.artemis.assessment.domain.ExampleSubmission;
import de.tum.cit.aet.artemis.assessment.domain.Feedback;
import de.tum.cit.aet.artemis.assessment.domain.GradingCriterion;
import de.tum.cit.aet.artemis.assessment.domain.GradingInstruction;
import de.tum.cit.aet.artemis.assessment.domain.Result;
import de.tum.cit.aet.artemis.assessment.domain.TutorParticipation;
import de.tum.cit.aet.artemis.assessment.repository.FeedbackRepository;
import de.tum.cit.aet.artemis.assessment.repository.GradingCriterionRepository;
import de.tum.cit.aet.artemis.assessment.test_repository.TutorParticipationTestRepository;
import de.tum.cit.aet.artemis.assessment.util.GradingCriterionUtil;
import de.tum.cit.aet.artemis.atlas.competency.util.CompetencyUtilService;
import de.tum.cit.aet.artemis.atlas.domain.competency.Competency;
import de.tum.cit.aet.artemis.atlas.domain.competency.CompetencyExerciseLink;
import de.tum.cit.aet.artemis.communication.domain.conversation.Channel;
import de.tum.cit.aet.artemis.communication.repository.conversation.ChannelRepository;
import de.tum.cit.aet.artemis.core.domain.Course;
import de.tum.cit.aet.artemis.core.dto.CourseForDashboardDTO;
import de.tum.cit.aet.artemis.core.util.PageableSearchUtilService;
import de.tum.cit.aet.artemis.core.util.TestResourceUtils;
import de.tum.cit.aet.artemis.exam.domain.ExerciseGroup;
import de.tum.cit.aet.artemis.exam.util.ExamUtilService;
import de.tum.cit.aet.artemis.exam.util.InvalidExamExerciseDatesArgumentProvider;
import de.tum.cit.aet.artemis.exam.util.InvalidExamExerciseDatesArgumentProvider.InvalidExamExerciseDateConfiguration;
import de.tum.cit.aet.artemis.exercise.domain.DifficultyLevel;
import de.tum.cit.aet.artemis.exercise.domain.ExerciseMode;
import de.tum.cit.aet.artemis.exercise.domain.IncludedInOverallScore;
import de.tum.cit.aet.artemis.exercise.domain.Team;
import de.tum.cit.aet.artemis.exercise.domain.TeamAssignmentConfig;
import de.tum.cit.aet.artemis.exercise.participation.util.ParticipationFactory;
import de.tum.cit.aet.artemis.exercise.participation.util.ParticipationUtilService;
import de.tum.cit.aet.artemis.exercise.repository.TeamRepository;
import de.tum.cit.aet.artemis.exercise.test_repository.StudentParticipationTestRepository;
import de.tum.cit.aet.artemis.exercise.test_repository.SubmissionTestRepository;
import de.tum.cit.aet.artemis.exercise.util.ExerciseIntegrationTestService;
import de.tum.cit.aet.artemis.modeling.domain.DiagramType;
import de.tum.cit.aet.artemis.modeling.domain.ModelingExercise;
import de.tum.cit.aet.artemis.modeling.domain.ModelingSubmission;
import de.tum.cit.aet.artemis.modeling.repository.ModelingExerciseRepository;
import de.tum.cit.aet.artemis.modeling.util.ModelingExerciseFactory;
import de.tum.cit.aet.artemis.modeling.util.ModelingExerciseUtilService;
import de.tum.cit.aet.artemis.plagiarism.domain.modeling.ModelingPlagiarismResult;
import de.tum.cit.aet.artemis.plagiarism.dto.PlagiarismResultDTO;
import de.tum.cit.aet.artemis.shared.base.AbstractSpringIntegrationLocalCILocalVCTest;
import de.tum.cit.aet.artemis.tutorialgroup.domain.TutorParticipationStatus;

class ModelingExerciseIntegrationTest extends AbstractSpringIntegrationLocalCILocalVCTest {

    private static final String TEST_PREFIX = "modelingexerciseintegration";

    @Autowired
    private ModelingExerciseUtilService modelingExerciseUtilService;

    @Autowired
    private ModelingExerciseRepository modelingExerciseRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private SubmissionTestRepository submissionRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private GradingCriterionRepository gradingCriterionRepository;

    @Autowired
    private StudentParticipationTestRepository studentParticipationRepository;

    @Autowired
    private ExerciseIntegrationTestService exerciseIntegrationTestService;

    @Autowired
    private TutorParticipationTestRepository tutorParticipationRepository;

    @Autowired
    private ChannelRepository channelRepository;

    @Autowired
    private ExamUtilService examUtilService;

    @Autowired
    private ParticipationUtilService participationUtilService;

    @Autowired
    private PageableSearchUtilService pageableSearchUtilService;

    @Autowired
    private CompetencyUtilService competencyUtilService;

    private ModelingExercise classExercise;

    private Set<GradingCriterion> gradingCriteria;

    private Competency competency;

    @BeforeEach
    void initTestCase() {
        userUtilService.addUsers(TEST_PREFIX, 2, 1, 0, 1);
        Course course = modelingExerciseUtilService.addCourseWithOneModelingExercise();
        classExercise = (ModelingExercise) course.getExercises().iterator().next();

        // Add users that are not in course
        userUtilService.createAndSaveUser(TEST_PREFIX + "instructor2");
        userUtilService.createAndSaveUser(TEST_PREFIX + "tutor2");

        competency = competencyUtilService.createCompetency(course);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "user1", roles = "USER")
    void testGetModelingExercise_asStudent_Forbidden() throws Exception {
        request.get("/api/modeling/modeling-exercises/" + classExercise.getId(), HttpStatus.FORBIDDEN, ModelingExercise.class);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetModelingExercise_asTA() throws Exception {
        exerciseUtilService.addChannelToExercise(classExercise);

        ModelingExercise receivedModelingExercise = request.get("/api/modeling/modeling-exercises/" + classExercise.getId(), HttpStatus.OK, ModelingExercise.class);
        assertThat(receivedModelingExercise.getId()).isNotNull();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor2", roles = "TA")
    void testGetModelingExercise_tutorNotInCourse() throws Exception {
        request.get("/api/modeling/modeling-exercises/" + classExercise.getId(), HttpStatus.FORBIDDEN, ModelingExercise.class);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetModelingExercise_setGradingInstructionFeedbackUsed() throws Exception {
        gradingCriteria = exerciseUtilService.addGradingInstructionsToExercise(classExercise);
        gradingCriterionRepository.saveAll(gradingCriteria);
        Feedback feedback = new Feedback();
        feedback.setGradingInstruction(GradingCriterionUtil.findAnyInstructionWhere(gradingCriteria, instruction -> true).orElseThrow());
        feedbackRepository.save(feedback);

        exerciseUtilService.addChannelToExercise(classExercise);

        ModelingExercise receivedModelingExercise = request.get("/api/modeling/modeling-exercises/" + classExercise.getId(), HttpStatus.OK, ModelingExercise.class);

        assertThat(receivedModelingExercise.isGradingInstructionFeedbackUsed()).isTrue();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testGetModelingExerciseForCourse_asTA() throws Exception {
        request.get("/api/modeling/courses/" + classExercise.getCourseViaExerciseGroupOrCourseMember().getId() + "/modeling-exercises", HttpStatus.OK, List.class);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor2", roles = "TA")
    void testGetModelingExerciseForCourse_tutorNotInCourse() throws Exception {
        request.get("/api/modeling/courses/" + classExercise.getCourseViaExerciseGroupOrCourseMember().getId() + "/modeling-exercises", HttpStatus.FORBIDDEN, List.class);
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = { "exercise-new-modeling-exercise", "" })
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testCreateModelingExercise_asInstructor(String channelName) throws Exception {
        ModelingExercise modelingExercise = ModelingExerciseFactory.createModelingExercise(classExercise.getCourseViaExerciseGroupOrCourseMember().getId());
        courseUtilService.enableMessagingForCourse(modelingExercise.getCourseViaExerciseGroupOrCourseMember());
        gradingCriteria = exerciseUtilService.addGradingInstructionsToExercise(modelingExercise);
        modelingExercise.setTitle("new modeling exercise");
        modelingExercise.setChannelName(channelName);
        ModelingExercise receivedModelingExercise = request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.CREATED);
        Channel channelFromDB = channelRepository.findChannelByExerciseId(receivedModelingExercise.getId());

        assertThat(receivedModelingExercise.getGradingCriteria()).hasSize(3);
        assertThat(receivedModelingExercise.getGradingCriteria().stream().map(criterion -> criterion.getStructuredGradingInstructions().size())).containsExactlyInAnyOrder(1, 1, 3);
        assertThat(channelFromDB).isNotNull();
        assertThat(channelFromDB.getName()).isEqualTo("exercise-new-modeling-exercise");

        modelingExercise = ModelingExerciseFactory.createModelingExercise(classExercise.getCourseViaExerciseGroupOrCourseMember().getId(), 1L);
        request.post("/api/modeling/modeling-exercises", modelingExercise, HttpStatus.BAD_REQUEST);

        modelingExercise = ModelingExerciseFactory.createModelingExercise(-1L);
        request.post("/api/modeling/modeling-exercises", modelingExercise, HttpStatus.NOT_FOUND);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor2", roles = "INSTRUCTOR")
    void testCreateModelingExercise_instructorNotInCourse() throws Exception {
        ModelingExercise modelingExercise = ModelingExerciseFactory.createModelingExercise(classExercise.getCourseViaExerciseGroupOrCourseMember().getId());
        request.post("/api/modeling/modeling-exercises", modelingExercise, HttpStatus.FORBIDDEN);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testUpdateModelingExercise_asInstructor() throws Exception {
        ModelingExercise modelingExercise = ModelingExerciseFactory.createModelingExercise(classExercise.getCourseViaExerciseGroupOrCourseMember().getId());
        courseUtilService.enableMessagingForCourse(modelingExercise.getCourseViaExerciseGroupOrCourseMember());
        modelingExercise.setChannelName("testchannel-" + UUID.randomUUID().toString().substring(0, 8));
        modelingExercise.setCompetencyLinks(Set.of(new CompetencyExerciseLink(competency, modelingExercise, 1)));
        modelingExercise.getCompetencyLinks().forEach(link -> link.getCompetency().setCourse(null));

        ModelingExercise createdModelingExercise = request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.CREATED);
        gradingCriteria = exerciseUtilService.addGradingInstructionsToExercise(modelingExercise);

        createdModelingExercise.setGradingCriteria(gradingCriteria);
        var params = new LinkedMultiValueMap<String, String>();
        var notificationText = "notified!";
        params.add("notificationText", notificationText);
        ModelingExercise returnedModelingExercise = request.putWithResponseBodyAndParams("/api/modeling/modeling-exercises", createdModelingExercise, ModelingExercise.class,
                HttpStatus.OK, params);
        assertThat(returnedModelingExercise.getGradingCriteria()).hasSameSizeAs(gradingCriteria);
        verify(groupNotificationService).notifyStudentAndEditorAndInstructorGroupAboutExerciseUpdate(returnedModelingExercise, notificationText);
        verify(examLiveEventsService, never()).createAndSendProblemStatementUpdateEvent(eq(returnedModelingExercise), eq(notificationText));
        verify(competencyProgressApi, timeout(1000).times(1)).updateProgressForUpdatedLearningObjectAsync(eq(createdModelingExercise), eq(Optional.of(createdModelingExercise)));
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testUpdateModelingExerciseWrongCourseId_asInstructor() throws Exception {
        // use an arbitrary course id that was not yet stored on the server to get a bad request in the PUT call
        ModelingExercise modelingExercise = ModelingExerciseFactory.createModelingExercise(Long.MAX_VALUE, classExercise.getId());
        request.put("/api/modeling/modeling-exercises", modelingExercise, HttpStatus.CONFLICT);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testUpdateModelingExerciseForExam_asInstructor() throws Exception {
        ExerciseGroup exerciseGroup = examUtilService.addExerciseGroupWithExamAndCourse(true, true);
        ModelingExercise modelingExercise = ModelingExerciseFactory.generateModelingExerciseForExam(DiagramType.ClassDiagram, exerciseGroup);
        modelingExerciseRepository.save(modelingExercise);

        modelingExercise.setProblemStatement("New problem statement");
        var params = new LinkedMultiValueMap<String, String>();
        var notificationText = "notified!";
        params.add("notificationText", notificationText);
        ModelingExercise returnedModelingExercise = request.putWithResponseBodyAndParams("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class,
                HttpStatus.OK, params);

        verify(groupNotificationService, never()).notifyStudentAndEditorAndInstructorGroupAboutExerciseUpdate(returnedModelingExercise, notificationText);
        verify(examLiveEventsService, times(1)).createAndSendProblemStatementUpdateEvent(eq(returnedModelingExercise), eq(notificationText));
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testUpdateModelingExercise_updatingCourseId_conflict() throws Exception {
        // Create a modeling exercise.
        ModelingExercise createdModelingExercise = classExercise;
        Long oldCourseId = createdModelingExercise.getCourseViaExerciseGroupOrCourseMember().getId();

        // Create a new course with different id.
        Long newCourseId = oldCourseId + 1;
        Course newCourse = courseUtilService.createCourse(newCourseId);

        // Assign new course to the modeling exercise.
        createdModelingExercise.setCourse(newCourse);

        // Modeling exercise update with the new course should fail.
        ModelingExercise returnedModelingExercise = request.putWithResponseBody("/api/modeling/modeling-exercises", createdModelingExercise, ModelingExercise.class,
                HttpStatus.CONFLICT);
        assertThat(returnedModelingExercise).isNull();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testUpdateModelingExerciseCriteria_asInstructor() throws Exception {
        ModelingExercise modelingExercise = ModelingExerciseFactory.createModelingExercise(classExercise.getCourseViaExerciseGroupOrCourseMember().getId());
        gradingCriteria = exerciseUtilService.addGradingInstructionsToExercise(modelingExercise);
        var currentCriteriaSize = modelingExercise.getGradingCriteria().size();
        var newCriteria = new GradingCriterion();
        newCriteria.setTitle("new");
        modelingExercise.addGradingCriteria(newCriteria);
        modelingExercise.setChannelName("testchannel-" + UUID.randomUUID().toString().substring(0, 8));
        ModelingExercise createdModelingExercise = request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.CREATED);
        assertThat(createdModelingExercise.getGradingCriteria()).hasSize(currentCriteriaSize + 1);

        modelingExercise.getGradingCriteria().stream().findFirst().orElseThrow().setTitle("UPDATED");
        modelingExercise.setChannelName("testchannelname-" + UUID.randomUUID().toString().substring(0, 8));

        createdModelingExercise = request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.CREATED);
        assertThat(GradingCriterionUtil.findGradingCriterionByTitle(createdModelingExercise, "UPDATED")).isNotNull();

        // If the grading criteria are deleted then their instructions should also be deleted
        modelingExercise.setGradingCriteria(null);
        modelingExercise.setChannelName("testchannelname-" + UUID.randomUUID().toString().substring(0, 8));

        createdModelingExercise = request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.CREATED);
        assertThat(createdModelingExercise.getGradingCriteria()).isEmpty();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testUpdateModelingExerciseInstructions_asInstructor() throws Exception {
        ModelingExercise modelingExercise = ModelingExerciseFactory.createModelingExercise(classExercise.getCourseViaExerciseGroupOrCourseMember().getId());
        gradingCriteria = exerciseUtilService.addGradingInstructionsToExercise(modelingExercise);

        GradingCriterion criterionToUpdate = modelingExercise.getGradingCriteria().stream().findAny().orElseThrow();
        var currentInstructionsSize = criterionToUpdate.getStructuredGradingInstructions().size();
        var newInstruction = new GradingInstruction();
        newInstruction.setInstructionDescription("New Instruction");

        criterionToUpdate.addStructuredGradingInstruction(newInstruction);
        modelingExercise.setChannelName("testchannel-" + UUID.randomUUID().toString().substring(0, 8));
        ModelingExercise createdModelingExercise = request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.CREATED);
        assertThat(GradingCriterionUtil.findGradingCriterionByTitle(createdModelingExercise, criterionToUpdate.getTitle()).getStructuredGradingInstructions())
                .hasSize(currentInstructionsSize + 1);

        criterionToUpdate.getStructuredGradingInstructions().stream().findFirst().orElseThrow().setInstructionDescription("UPDATE");
        modelingExercise.setChannelName("testchannelname-" + UUID.randomUUID().toString().substring(0, 8));

        createdModelingExercise = request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.CREATED);
        assertThat(GradingCriterionUtil.findGradingCriterionByTitle(createdModelingExercise, criterionToUpdate.getTitle()).getStructuredGradingInstructions())
                .anyMatch(instruction -> "UPDATE".equals(instruction.getInstructionDescription()));

        criterionToUpdate.setStructuredGradingInstructions(null);
        modelingExercise.setChannelName("testchannelname-" + UUID.randomUUID().toString().substring(0, 8));
        createdModelingExercise = request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.CREATED);
        assertThat(createdModelingExercise.getGradingCriteria()).isNotEmpty();
        assertThat(GradingCriterionUtil.findGradingCriterionByTitle(createdModelingExercise, criterionToUpdate.getTitle()).getStructuredGradingInstructions()).isNullOrEmpty();
    }

    @ParameterizedTest(name = "{displayName} [{index}] {argumentsWithNames}")
    @ArgumentsSource(InvalidExamExerciseDatesArgumentProvider.class)
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testUpdateModelingExerciseForExam_invalidExercise_dates(InvalidExamExerciseDateConfiguration invalidDates) throws Exception {
        ExerciseGroup exerciseGroup = examUtilService.addExerciseGroupWithExamAndCourse(true);
        ModelingExercise modelingExercise = ModelingExerciseFactory.generateModelingExerciseForExam(DiagramType.ClassDiagram, exerciseGroup);
        modelingExerciseRepository.save(modelingExercise);

        request.postWithResponseBody("/api/modeling/modeling-exercises", invalidDates.applyTo(modelingExercise), ModelingExercise.class, HttpStatus.BAD_REQUEST);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void updateModelingExerciseDueDate() throws Exception {
        final ZonedDateTime individualDueDate = ZonedDateTime.now().plusHours(20);

        {
            final ModelingSubmission submission1 = ParticipationFactory.generateModelingSubmission("model1", true);
            modelingExerciseUtilService.addModelingSubmission(classExercise, submission1, TEST_PREFIX + "student1");
            final ModelingSubmission submission2 = ParticipationFactory.generateModelingSubmission("model2", false);
            modelingExerciseUtilService.addModelingSubmission(classExercise, submission2, TEST_PREFIX + "student2");

            final var participations = new ArrayList<>(studentParticipationRepository.findByExerciseId(classExercise.getId()));
            assertThat(participations).hasSize(2);
            participations.getFirst().setIndividualDueDate(ZonedDateTime.now().plusHours(2));
            participations.get(1).setIndividualDueDate(individualDueDate);
            studentParticipationRepository.saveAll(participations);
        }

        classExercise.setDueDate(ZonedDateTime.now().plusHours(12));
        request.put("/api/modeling/modeling-exercises", classExercise, HttpStatus.OK);

        {
            final var participations = studentParticipationRepository.findByExerciseId(classExercise.getId());
            final var withNoIndividualDueDate = participations.stream().filter(participation -> participation.getIndividualDueDate() == null).toList();
            assertThat(withNoIndividualDueDate).hasSize(1);

            final var withIndividualDueDate = participations.stream().filter(participation -> participation.getIndividualDueDate() != null).toList();
            assertThat(withIndividualDueDate).hasSize(1);
            assertThat(withIndividualDueDate.getFirst().getIndividualDueDate()).isCloseTo(individualDueDate, HalfSecond());
        }
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor2", roles = "INSTRUCTOR")
    void testUpdateModelingExercise_instructorNotInCourse() throws Exception {
        request.put("/api/modeling/modeling-exercises", classExercise, HttpStatus.FORBIDDEN);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testDeleteModelingExercise_asInstructor() throws Exception {
        request.delete("/api/modeling/modeling-exercises/" + classExercise.getId(), HttpStatus.OK);
        assertThat(modelingExerciseRepository.findById(classExercise.getId())).as("exercise was deleted").isEmpty();
        request.delete("/api/modeling/modeling-exercises/" + classExercise.getId(), HttpStatus.NOT_FOUND);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testDeleteModelingExerciseWithCompetency() throws Exception {
        classExercise.setCompetencyLinks(Set.of(new CompetencyExerciseLink(competency, classExercise, 1)));
        modelingExerciseRepository.save(classExercise);

        request.delete("/api/modeling/modeling-exercises/" + classExercise.getId(), HttpStatus.OK);

        verify(competencyProgressApi).updateProgressByCompetencyAsync(eq(competency));
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testDeleteModelingExerciseWithChannel() throws Exception {
        Course course = modelingExerciseUtilService.addCourseWithOneModelingExercise();
        ModelingExercise modelingExercise = modelingExerciseRepository.findByCourseIdWithCategories(course.getId()).getFirst();
        Channel exerciseChannel = exerciseUtilService.addChannelToExercise(modelingExercise);

        request.delete("/api/modeling/modeling-exercises/" + modelingExercise.getId(), HttpStatus.OK);

        Optional<Channel> exerciseChannelAfterDelete = channelRepository.findById(exerciseChannel.getId());
        assertThat(exerciseChannelAfterDelete).isEmpty();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testDeleteModelingExerciseWithTutorParticipations() throws Exception {
        TutorParticipation tutorParticipation = new TutorParticipation().tutor(userUtilService.getUserByLogin(TEST_PREFIX + "tutor1"))
                .status(TutorParticipationStatus.REVIEWED_INSTRUCTIONS).assessedExercise(classExercise);

        String validModel = TestResourceUtils.loadFileFromResources("test-data/model-submission/model.54727.json");
        ExampleSubmission exampleSubmission = participationUtilService.generateExampleSubmission(validModel, classExercise, true);
        exampleSubmission.addTutorParticipations(tutorParticipation);
        participationUtilService.addExampleSubmission(exampleSubmission);
        tutorParticipationRepository.save(tutorParticipation);

        assertThat(tutorParticipationRepository.findByAssessedExercise(classExercise)).isNotEmpty();

        request.delete("/api/modeling/modeling-exercises/" + classExercise.getId(), HttpStatus.OK);

        assertThat(modelingExerciseRepository.findById(classExercise.getId())).as("exercise was deleted").isEmpty();
        assertThat(tutorParticipationRepository.findByAssessedExercise(classExercise)).isEmpty();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void testDeleteModelingExercise_asTutor_Forbidden() throws Exception {
        request.delete("/api/modeling/modeling-exercises/" + classExercise.getId(), HttpStatus.FORBIDDEN);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor2", roles = "INSTRUCTOR")
    void testDeleteModelingExercise_notInstructorInCourse() throws Exception {
        request.delete("/api/modeling/modeling-exercises/" + classExercise.getId(), HttpStatus.FORBIDDEN);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void importModelingExerciseFromCourseToCourse() throws Exception {
        var now = ZonedDateTime.now();
        Course course1 = courseUtilService.addEmptyCourse();
        Course course2 = courseUtilService.addEmptyCourse();
        courseUtilService.enableMessagingForCourse(course2);
        ModelingExercise modelingExerciseToImport = ModelingExerciseFactory.generateModelingExercise(now.minusDays(1), now.minusHours(2), now.minusHours(1),
                DiagramType.ClassDiagram, course1);
        modelingExerciseRepository.save(modelingExerciseToImport);
        modelingExerciseToImport.setCourse(course2);
        String uniqueChannelName = "channel-" + UUID.randomUUID().toString().substring(0, 8);
        modelingExerciseToImport.setChannelName(uniqueChannelName);
        modelingExerciseToImport.getCompetencyLinks().add(new CompetencyExerciseLink(competency, modelingExerciseToImport, 1));
        modelingExerciseToImport.getCompetencyLinks().forEach(link -> link.getCompetency().setCourse(null));

        var importedExercise = request.postWithResponseBody("/api/modeling/modeling-exercises/import/" + modelingExerciseToImport.getId(), modelingExerciseToImport,
                ModelingExercise.class, HttpStatus.CREATED);
        assertThat(importedExercise).usingRecursiveComparison().ignoringFields("id", "course", "shortName", "releaseDate", "dueDate", "assessmentDueDate",
                "exampleSolutionPublicationDate", "channelNameTransient", "plagiarismDetectionConfig.id", "competencyLinks").isEqualTo(modelingExerciseToImport);
        Channel channelFromDB = channelRepository.findChannelByExerciseId(importedExercise.getId());
        assertThat(channelFromDB).isNotNull();
        assertThat(channelFromDB.getName()).isEqualTo(uniqueChannelName);
        verify(competencyProgressApi).updateProgressByLearningObjectAsync(eq(importedExercise));
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void importModelingExerciseWithExampleSubmissionFromCourseToCourse() throws Exception {
        var now = ZonedDateTime.now();
        Course course1 = courseUtilService.addEmptyCourse();
        Course course2 = courseUtilService.addEmptyCourse();

        ModelingExercise modelingExercise = ModelingExerciseFactory.generateModelingExercise(now.minusDays(1), now.minusHours(2), now.minusHours(1), DiagramType.ClassDiagram,
                course1);
        modelingExercise = modelingExerciseRepository.save(modelingExercise);
        exerciseUtilService.addGradingInstructionsToExercise(modelingExercise);

        // Create example submission
        var exampleSubmission = participationUtilService.generateExampleSubmission("model", modelingExercise, true);
        exampleSubmission = participationUtilService.addExampleSubmission(exampleSubmission);
        participationUtilService.addResultToSubmission(exampleSubmission.getSubmission(), AssessmentType.MANUAL);
        var submission = submissionRepository.findWithEagerResultAndFeedbackAndAssessmentNoteById(exampleSubmission.getSubmission().getId()).orElseThrow();
        participationUtilService.addFeedbackToResult(ParticipationFactory.generateFeedback().stream().findFirst().orElseThrow(),
                Objects.requireNonNull(submission.getLatestResult()));
        modelingExercise.setChannelName("testchannel-" + UUID.randomUUID().toString().substring(0, 8));

        modelingExercise.setCourse(course2);
        var importedModelingExercise = request.postWithResponseBody("/api/modeling/modeling-exercises/import/" + modelingExercise.getId(), modelingExercise, ModelingExercise.class,
                HttpStatus.CREATED);

        assertThat(modelingExerciseRepository.findById(importedModelingExercise.getId())).isPresent();
        importedModelingExercise = modelingExerciseRepository.findByIdWithExampleSubmissionsAndResultsAndPlagiarismDetectionConfigAndGradingCriteria(modelingExercise.getId())
                .orElseThrow();

        var importedExampleSubmission = importedModelingExercise.getExampleSubmissions().stream().findFirst().orElseThrow();
        assertThat(importedExampleSubmission.getId()).isEqualTo(exampleSubmission.getId());
        assertThat(importedExampleSubmission.getSubmission().getLatestResult()).isEqualTo(submission.getLatestResult());
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void importModelingExerciseFromCourseToExam() throws Exception {
        var now = ZonedDateTime.now();
        Course course1 = courseUtilService.addEmptyCourse();
        ExerciseGroup exerciseGroup1 = examUtilService.addExerciseGroupWithExamAndCourse(true);
        ModelingExercise modelingExercise = ModelingExerciseFactory.generateModelingExercise(now.minusDays(1), now.minusHours(2), now.minusHours(1), DiagramType.ClassDiagram,
                course1);
        modelingExercise.setReleaseDate(null);
        modelingExercise.setDueDate(null);
        modelingExercise.setAssessmentDueDate(null);
        modelingExerciseRepository.save(modelingExercise);
        modelingExercise.setCourse(null);
        modelingExercise.setExerciseGroup(exerciseGroup1);

        var importedExercise = request.postWithResponseBody("/api/modeling/modeling-exercises/import/" + modelingExercise.getId(), modelingExercise, ModelingExercise.class,
                HttpStatus.CREATED);

        Channel channelFromDB = channelRepository.findChannelByExerciseId(importedExercise.getId());
        assertThat(channelFromDB).isNull();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "TA")
    void importModelingExerciseFromCourseToExam_forbidden() throws Exception {
        var now = ZonedDateTime.now();
        Course course1 = courseUtilService.addEmptyCourse();
        ExerciseGroup exerciseGroup1 = examUtilService.addExerciseGroupWithExamAndCourse(true);
        ModelingExercise modelingExercise = ModelingExerciseFactory.generateModelingExercise(now.minusDays(1), now.minusHours(2), now.minusHours(1), DiagramType.ClassDiagram,
                course1);
        modelingExerciseRepository.save(modelingExercise);
        modelingExercise.setCourse(null);
        modelingExercise.setExerciseGroup(exerciseGroup1);

        request.postWithResponseBody("/api/modeling/modeling-exercises/import/" + modelingExercise.getId(), modelingExercise, ModelingExercise.class, HttpStatus.FORBIDDEN);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void importModelingExerciseFromExamToCourse() throws Exception {
        ExerciseGroup exerciseGroup1 = examUtilService.addExerciseGroupWithExamAndCourse(true);
        ModelingExercise modelingExercise = ModelingExerciseFactory.generateModelingExerciseForExam(DiagramType.ClassDiagram, exerciseGroup1);
        Course course1 = courseUtilService.addEmptyCourse();
        modelingExerciseRepository.save(modelingExercise);
        modelingExercise.setCourse(course1);
        modelingExercise.setExerciseGroup(null);
        modelingExercise.setChannelName("testchannel-" + UUID.randomUUID().toString().substring(0, 8));
        request.postWithResponseBody("/api/modeling/modeling-exercises/import/" + modelingExercise.getId(), modelingExercise, ModelingExercise.class, HttpStatus.CREATED);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "TA")
    void importModelingExerciseFromExamToCourse_forbidden() throws Exception {
        ExerciseGroup exerciseGroup1 = examUtilService.addExerciseGroupWithExamAndCourse(true);
        ModelingExercise modelingExercise = ModelingExerciseFactory.generateModelingExerciseForExam(DiagramType.ClassDiagram, exerciseGroup1);
        Course course1 = courseUtilService.addEmptyCourse();
        modelingExerciseRepository.save(modelingExercise);
        modelingExercise.setCourse(course1);
        modelingExercise.setExerciseGroup(null);

        request.postWithResponseBody("/api/modeling/modeling-exercises/import/" + modelingExercise.getId(), modelingExercise, ModelingExercise.class, HttpStatus.FORBIDDEN);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void importModelingExerciseFromExamToExam() throws Exception {
        ExerciseGroup exerciseGroup1 = examUtilService.addExerciseGroupWithExamAndCourse(true);
        ExerciseGroup exerciseGroup2 = examUtilService.addExerciseGroupWithExamAndCourse(true);
        ModelingExercise modelingExercise = ModelingExerciseFactory.generateModelingExerciseForExam(DiagramType.ClassDiagram, exerciseGroup1);
        modelingExerciseRepository.save(modelingExercise);
        modelingExercise.setExerciseGroup(exerciseGroup2);

        request.postWithResponseBody("/api/modeling/modeling-exercises/import/" + modelingExercise.getId(), modelingExercise, ModelingExercise.class, HttpStatus.CREATED);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void importModelingExerciseFromCourseToCourse_badRequest() throws Exception {
        var now = ZonedDateTime.now();
        Course course1 = courseUtilService.addEmptyCourse();
        ModelingExercise modelingExercise = ModelingExerciseFactory.generateModelingExercise(now.minusDays(1), now.minusHours(2), now.minusHours(1), DiagramType.ClassDiagram,
                course1);
        modelingExerciseRepository.save(modelingExercise);
        modelingExercise.setCourse(null);

        request.postWithResponseBody("/api/modeling/modeling-exercises/import/" + modelingExercise.getId(), modelingExercise, ModelingExercise.class, HttpStatus.BAD_REQUEST);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void importModelingExerciseFromCourseToCourse_exampleSolutionPublicationDate() throws Exception {
        var now = ZonedDateTime.now();
        Course course1 = courseUtilService.addEmptyCourse();
        Course course2 = courseUtilService.addEmptyCourse();
        ModelingExercise modelingExercise = ModelingExerciseFactory.generateModelingExercise(now.minusDays(1), now.minusHours(2), now.minusHours(1), DiagramType.ClassDiagram,
                course1);

        modelingExercise.setExampleSolutionPublicationDate(ZonedDateTime.now());

        modelingExerciseRepository.save(modelingExercise);
        modelingExercise.setCourse(course2);
        modelingExercise.setChannelName("testchannel-" + UUID.randomUUID().toString().substring(0, 8));

        ModelingExercise newModelingExercise = request.postWithResponseBody("/api/modeling/modeling-exercises/import/" + modelingExercise.getId(), modelingExercise,
                ModelingExercise.class, HttpStatus.CREATED);
        assertThat(newModelingExercise.getExampleSolutionPublicationDate()).as("modeling example solution publication date was correctly set to null in the response").isNull();

        ModelingExercise newModelingExerciseFromDatabase = modelingExerciseRepository.findById(newModelingExercise.getId()).orElseThrow();
        assertThat(newModelingExerciseFromDatabase.getExampleSolutionPublicationDate()).as("modeling example solution publication date was correctly set to null in the database")
                .isNull();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void createModelingExerciseForExam() throws Exception {
        ExerciseGroup exerciseGroup = examUtilService.addExerciseGroupWithExamAndCourse(true);
        ModelingExercise modelingExercise = ModelingExerciseFactory.generateModelingExerciseForExam(DiagramType.ClassDiagram, exerciseGroup);

        String title = "New Exam Modeling Exercise";
        DifficultyLevel difficulty = DifficultyLevel.HARD;
        modelingExercise.setTitle(title);
        modelingExercise.setDifficulty(difficulty);

        ModelingExercise newModelingExercise = request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.CREATED);
        Channel channelFromDB = channelRepository.findChannelByExerciseId(newModelingExercise.getId());

        assertThat(channelFromDB).isNull(); // there should not be any channel for exam exercise

        assertThat(newModelingExercise.getTitle()).as("modeling exercise title was correctly set").isEqualTo(title);
        assertThat(newModelingExercise.getDifficulty()).as("modeling exercise difficulty was correctly set").isEqualTo(difficulty);
        assertThat(newModelingExercise.isCourseExercise()).as("course was not set for exam exercise").isFalse();
        assertThat(newModelingExercise.getExerciseGroup()).as("exerciseGroup was set for exam exercise").isNotNull();
        assertThat(newModelingExercise.getExerciseGroup().getId()).as("exerciseGroupId was set correctly").isEqualTo(exerciseGroup.getId());
    }

    @ParameterizedTest(name = "{displayName} [{index}] {argumentsWithNames}")
    @ArgumentsSource(InvalidExamExerciseDatesArgumentProvider.class)
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void createModelingExerciseForExam_invalidExercise_dates(InvalidExamExerciseDateConfiguration invalidDates) throws Exception {
        ExerciseGroup exerciseGroup = examUtilService.addExerciseGroupWithExamAndCourse(true);
        ModelingExercise modelingExercise = ModelingExerciseFactory.generateModelingExerciseForExam(DiagramType.ClassDiagram, exerciseGroup);

        request.postWithResponseBody("/api/modeling/modeling-exercises", invalidDates.applyTo(modelingExercise), ModelingExercise.class, HttpStatus.BAD_REQUEST);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void createModelingExercise_setCourseAndExerciseGroup_badRequest() throws Exception {
        ExerciseGroup exerciseGroup = examUtilService.addExerciseGroupWithExamAndCourse(true);
        ModelingExercise modelingExercise = ModelingExerciseFactory.generateModelingExerciseForExam(DiagramType.ClassDiagram, exerciseGroup);
        modelingExercise.setCourse(exerciseGroup.getExam().getCourse());
        request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.BAD_REQUEST);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void createModelingExercise_setNeitherCourseAndExerciseGroup_badRequest() throws Exception {
        ModelingExercise modelingExercise = ModelingExerciseFactory.generateModelingExerciseForExam(DiagramType.ClassDiagram, null);
        request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.BAD_REQUEST);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void createModelingExercise_InvalidMaxScore() throws Exception {
        ModelingExercise modelingExercise = ModelingExerciseFactory.createModelingExercise(classExercise.getCourseViaExerciseGroupOrCourseMember().getId());
        modelingExercise.setMaxPoints(0.0);
        request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.BAD_REQUEST);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void createModelingExercise_IncludedAsBonusInvalidBonusPoints() throws Exception {
        ModelingExercise modelingExercise = ModelingExerciseFactory.createModelingExercise(classExercise.getCourseViaExerciseGroupOrCourseMember().getId());
        modelingExercise.setMaxPoints(10.0);
        modelingExercise.setBonusPoints(1.0);
        modelingExercise.setIncludedInOverallScore(IncludedInOverallScore.INCLUDED_AS_BONUS);
        request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.BAD_REQUEST);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void createModelingExercise_NotIncludedInvalidBonusPoints() throws Exception {
        ModelingExercise modelingExercise = ModelingExerciseFactory.createModelingExercise(classExercise.getCourseViaExerciseGroupOrCourseMember().getId());
        modelingExercise.setMaxPoints(10.0);
        modelingExercise.setBonusPoints(1.0);
        modelingExercise.setIncludedInOverallScore(IncludedInOverallScore.NOT_INCLUDED);
        request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.BAD_REQUEST);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor2", roles = "INSTRUCTOR")
    void testInstructorGetsOnlyResultsFromOwningCourses() throws Exception {
        final var search = pageableSearchUtilService.configureSearch("");
        final var result = request.getSearchResult("/api/modeling/modeling-exercises", HttpStatus.OK, ModelingExercise.class, pageableSearchUtilService.searchMapping(search));
        assertThat(result.getResultsOnPage()).isNullOrEmpty();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testInstructorSearchTermMatchesTitle() throws Exception {
        userUtilService.addUsers(TEST_PREFIX, 1, 1, 0, 1);
        testSearchTermMatchesTitle(TEST_PREFIX + "testInstructorSearchTermMatchesTitle");
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testAdminSearchTermMatchesTitle() throws Exception {
        userUtilService.addUsers(TEST_PREFIX, 1, 1, 0, 1);
        testSearchTermMatchesTitle(TEST_PREFIX + "testAdminSearchTermMatchesTitle");
    }

    private void testSearchTermMatchesTitle(String exerciseTitle) throws Exception {
        final Course course = courseUtilService.addEmptyCourse();
        final var now = ZonedDateTime.now();
        ModelingExercise exercise = ModelingExerciseFactory.generateModelingExercise(now.minusDays(1), now.minusHours(2), now.minusHours(1), DiagramType.ClassDiagram, course);
        exercise.setTitle(exerciseTitle);
        exercise = modelingExerciseRepository.save(exercise);

        final var searchTerm = pageableSearchUtilService.configureSearch(exercise.getTitle());
        final var searchResult = request.getSearchResult("/api/modeling/modeling-exercises", HttpStatus.OK, ModelingExercise.class,
                pageableSearchUtilService.searchMapping(searchTerm));
        assertThat(searchResult.getResultsOnPage()).hasSize(1);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testInstructorGetsResultsFromOwningCoursesNotEmpty() throws Exception {
        final String titleExtension = "testInstructorGetsResultsFromOwningCoursesNotEmpty";
        modelingExerciseUtilService.addCourseWithOneModelingExercise("ClassDiagram" + titleExtension);
        modelingExerciseUtilService.addCourseWithOneModelingExercise("Activity Diagram" + titleExtension);
        final var searchClassDiagram = pageableSearchUtilService.configureSearch("ClassDiagram" + titleExtension);
        final var resultClassDiagram = request.getSearchResult("/api/modeling/modeling-exercises", HttpStatus.OK, ModelingExercise.class,
                pageableSearchUtilService.searchMapping(searchClassDiagram));
        assertThat(resultClassDiagram.getResultsOnPage()).hasSize(1);

        final var searchActivityDiagram = pageableSearchUtilService.configureSearch("Activity Diagram" + titleExtension);
        final var resultActivityDiagram = request.getSearchResult("/api/modeling/modeling-exercises", HttpStatus.OK, ModelingExercise.class,
                pageableSearchUtilService.searchMapping(searchActivityDiagram));
        assertThat(resultActivityDiagram.getResultsOnPage()).hasSize(1);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testAdminGetsResultsFromAllCourses() throws Exception {
        String searchTerm = "ClassDiagram testAdminGetsResultsFromAllCourses";
        final var search = pageableSearchUtilService.configureSearch(searchTerm);
        final var oldResult = request.getSearchResult("/api/modeling/modeling-exercises", HttpStatus.OK, ModelingExercise.class, pageableSearchUtilService.searchMapping(search));
        courseUtilService.addCourseInOtherInstructionGroupAndExercise(searchTerm);
        final var result = request.getSearchResult("/api/modeling/modeling-exercises", HttpStatus.OK, ModelingExercise.class, pageableSearchUtilService.searchMapping(search));
        assertThat(result.getResultsOnPage()).hasSize(oldResult.getResultsOnPage().size() + 1);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testCourseAndExamFiltersAsInstructor() throws Exception {
        testCourseAndExamFilters("testCourseAndExamFiltersAsInstructor");
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void testCourseAndExamFiltersAsAdmin() throws Exception {
        testCourseAndExamFilters("testCourseAndExamFiltersAsAdmin");
    }

    private void testCourseAndExamFilters(String title) throws Exception {
        modelingExerciseUtilService.addCourseWithOneModelingExercise(title);
        modelingExerciseUtilService.addCourseExamExerciseGroupWithOneModelingExercise(title + "-Morpork");
        exerciseIntegrationTestService.testCourseAndExamFilters("/api/modeling/modeling-exercises", title);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testImport_team_modeChange() throws Exception {
        var now = ZonedDateTime.now();
        Course course1 = courseUtilService.addEmptyCourse();
        Course course2 = courseUtilService.addEmptyCourse();
        ModelingExercise sourceExercise = ModelingExerciseFactory.generateModelingExercise(now.minusDays(1), now.minusHours(2), now.minusHours(1), DiagramType.ClassDiagram,
                course1);
        sourceExercise.setMode(ExerciseMode.INDIVIDUAL);
        sourceExercise = modelingExerciseRepository.save(sourceExercise);

        var exerciseToBeImported = ModelingExerciseFactory.generateModelingExercise(now.minusDays(1), now.minusHours(2), now.minusHours(1), DiagramType.ClassDiagram, course2);
        exerciseToBeImported.setMode(ExerciseMode.TEAM);
        exerciseToBeImported.setCourse(course2);

        var teamAssignmentConfig = new TeamAssignmentConfig();
        teamAssignmentConfig.setExercise(exerciseToBeImported);
        teamAssignmentConfig.setMinTeamSize(1);
        teamAssignmentConfig.setMaxTeamSize(10);
        exerciseToBeImported.setTeamAssignmentConfig(teamAssignmentConfig);
        exerciseToBeImported.setChannelName("testchannel-" + UUID.randomUUID().toString().substring(0, 8));
        exerciseToBeImported = request.postWithResponseBody("/api/modeling/modeling-exercises/import/" + sourceExercise.getId(), exerciseToBeImported, ModelingExercise.class,
                HttpStatus.CREATED);

        assertThat(exerciseToBeImported.getCourseViaExerciseGroupOrCourseMember().getId()).isEqualTo(course2.getId());
        assertThat(exerciseToBeImported.getMode()).isEqualTo(ExerciseMode.TEAM);
        assertThat(exerciseToBeImported.getTeamAssignmentConfig().getMinTeamSize()).isEqualTo(teamAssignmentConfig.getMinTeamSize());
        assertThat(exerciseToBeImported.getTeamAssignmentConfig().getMaxTeamSize()).isEqualTo(teamAssignmentConfig.getMaxTeamSize());
        assertThat(teamRepository.findAllByExerciseIdWithEagerStudents(exerciseToBeImported, null)).isEmpty();

        sourceExercise = modelingExerciseRepository.findById(sourceExercise.getId()).orElseThrow();
        assertThat(sourceExercise.getCourseViaExerciseGroupOrCourseMember().getId()).isEqualTo(course1.getId());
        assertThat(sourceExercise.getMode()).isEqualTo(ExerciseMode.INDIVIDUAL);
        assertThat(teamRepository.findAllByExerciseIdWithEagerStudents(sourceExercise, null)).isEmpty();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testImport_individual_modeChange() throws Exception {
        var now = ZonedDateTime.now();
        Course course1 = courseUtilService.addEmptyCourse();
        Course course2 = courseUtilService.addEmptyCourse();
        ModelingExercise sourceExercise = ModelingExerciseFactory.generateModelingExercise(now.minusDays(1), now.minusHours(2), now.minusHours(1), DiagramType.ClassDiagram,
                course1);
        sourceExercise.setMode(ExerciseMode.TEAM);
        var teamAssignmentConfig = new TeamAssignmentConfig();
        teamAssignmentConfig.setExercise(sourceExercise);
        teamAssignmentConfig.setMinTeamSize(1);
        teamAssignmentConfig.setMaxTeamSize(10);
        sourceExercise.setTeamAssignmentConfig(teamAssignmentConfig);
        sourceExercise.setCourse(course1);

        sourceExercise = modelingExerciseRepository.save(sourceExercise);
        var team = new Team();
        team.setShortName(TEST_PREFIX + "testImport_individual_modeChange");
        teamRepository.save(sourceExercise, team);

        var exerciseToBeImported = ModelingExerciseFactory.generateModelingExercise(now.minusDays(1), now.minusHours(2), now.minusHours(1), DiagramType.ClassDiagram, course2);
        exerciseToBeImported.setMode(ExerciseMode.INDIVIDUAL);
        exerciseToBeImported.setCourse(course2);
        exerciseToBeImported.setChannelName("channelName-" + UUID.randomUUID().toString().substring(0, 8));
        exerciseToBeImported = request.postWithResponseBody("/api/modeling/modeling-exercises/import/" + sourceExercise.getId(), exerciseToBeImported, ModelingExercise.class,
                HttpStatus.CREATED);

        assertThat(exerciseToBeImported.getCourseViaExerciseGroupOrCourseMember().getId()).isEqualTo(course2.getId());
        assertThat(exerciseToBeImported.getMode()).isEqualTo(ExerciseMode.INDIVIDUAL);
        assertThat(exerciseToBeImported.getTeamAssignmentConfig()).isNull();
        assertThat(teamRepository.findAllByExerciseIdWithEagerStudents(exerciseToBeImported, null)).isEmpty();

        sourceExercise = modelingExerciseRepository.findById(sourceExercise.getId()).orElseThrow();
        assertThat(sourceExercise.getCourseViaExerciseGroupOrCourseMember().getId()).isEqualTo(course1.getId());
        assertThat(sourceExercise.getMode()).isEqualTo(ExerciseMode.TEAM);
        assertThat(teamRepository.findAllByExerciseIdWithEagerStudents(sourceExercise, null)).hasSize(1);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetPlagiarismResult() throws Exception {
        final Course course = modelingExerciseUtilService.addCourseWithOneModelingExercise();
        ModelingExercise modelingExercise = modelingExerciseRepository.findByCourseIdWithCategories(course.getId()).getFirst();

        ModelingPlagiarismResult expectedResult = modelingExerciseUtilService.createModelingPlagiarismResultForExercise(modelingExercise);

        var result = request.get("/api/modeling/modeling-exercises/" + modelingExercise.getId() + "/plagiarism-result", HttpStatus.OK, PlagiarismResultDTO.class);
        assertThat(result.plagiarismResult().getId()).isEqualTo(expectedResult.getId());
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetPlagiarismResultWithoutResult() throws Exception {
        final Course course = modelingExerciseUtilService.addCourseWithOneModelingExercise();
        ModelingExercise modelingExercise = modelingExerciseRepository.findByCourseIdWithCategories(course.getId()).getFirst();
        var result = request.get("/api/modeling/modeling-exercises/" + modelingExercise.getId() + "/plagiarism-result", HttpStatus.OK, String.class);
        assertThat(result).isNullOrEmpty();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetPlagiarismResultWithoutExercise() throws Exception {
        Long exerciseId = classExercise.getId();
        modelingExerciseRepository.deleteById(exerciseId);
        ModelingPlagiarismResult result = request.get("/api/modeling/modeling-exercises/" + exerciseId + "/plagiarism-result", HttpStatus.NOT_FOUND,
                ModelingPlagiarismResult.class);
        assertThat(result).isNull();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testReEvaluateAndUpdateModelingExercise() throws Exception {
        Set<GradingCriterion> gradingCriteria = exerciseUtilService.addGradingInstructionsToExercise(classExercise);
        gradingCriterionRepository.saveAll(gradingCriteria);

        participationUtilService.addAssessmentWithFeedbackWithGradingInstructionsForExercise(classExercise, TEST_PREFIX + "instructor1");

        // change grading instruction score
        GradingCriterion toUpdate = GradingCriterionUtil.findAnyWhere(gradingCriteria, criterion -> !criterion.getStructuredGradingInstructions().isEmpty()).orElseThrow();
        toUpdate.getStructuredGradingInstructions().stream().findFirst().orElseThrow().setCredits(3);
        gradingCriteria.removeIf(criterion -> criterion != toUpdate);
        classExercise.setGradingCriteria(gradingCriteria);

        ModelingExercise updatedModelingExercise = request.putWithResponseBody(
                "/api/modeling/modeling-exercises/" + classExercise.getId() + "/re-evaluate" + "?deleteFeedback=false", classExercise, ModelingExercise.class, HttpStatus.OK);
        List<Result> updatedResults = participationUtilService.getResultsForExercise(updatedModelingExercise);
        assertThat(GradingCriterionUtil.findAnyInstructionWhere(updatedModelingExercise.getGradingCriteria(), instruction -> instruction.getCredits() == 3)).isPresent();
        assertThat(updatedResults.getFirst().getScore()).isEqualTo(60);
        assertThat(updatedResults.getFirst().getFeedbacks().getFirst().getCredits()).isEqualTo(3);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testReEvaluateAndUpdateModelingExercise_shouldDeleteFeedbacks() throws Exception {
        Set<GradingCriterion> gradingCriteria = exerciseUtilService.addGradingInstructionsToExercise(classExercise);
        gradingCriterionRepository.saveAll(gradingCriteria);

        participationUtilService.addAssessmentWithFeedbackWithGradingInstructionsForExercise(classExercise, TEST_PREFIX + "instructor1");

        // remove instruction which is associated with feedbacks
        gradingCriteria.removeIf(criterion -> criterion.getTitle() == null);
        classExercise.setGradingCriteria(gradingCriteria);

        ModelingExercise updatedModelingExercise = request.putWithResponseBody(
                "/api/modeling/modeling-exercises/" + classExercise.getId() + "/re-evaluate" + "?deleteFeedback=true", classExercise, ModelingExercise.class, HttpStatus.OK);
        List<Result> updatedResults = participationUtilService.getResultsForExercise(updatedModelingExercise);
        assertThat(updatedModelingExercise.getGradingCriteria()).hasSize(2);
        assertThat(updatedResults.getFirst().getScore()).isZero();
        assertThat(updatedResults.getFirst().getFeedbacks()).isEmpty();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor2", roles = "INSTRUCTOR")
    void testReEvaluateAndUpdateModelingExercise_isNotAtLeastInstructorInCourse_forbidden() throws Exception {
        Course course = modelingExerciseUtilService.addCourseWithOneModelingExercise();
        classExercise = (ModelingExercise) course.getExercises().iterator().next();
        course.setInstructorGroupName("test");
        courseRepository.save(course);
        request.put("/api/modeling/modeling-exercises/" + classExercise.getId() + "/re-evaluate", classExercise, HttpStatus.FORBIDDEN);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testReEvaluateAndUpdateModelingExercise_isNotSameGivenExerciseIdInRequestBody_conflict() throws Exception {
        ModelingExercise modelingExerciseToBeConflicted = modelingExerciseRepository.findByIdElseThrow(classExercise.getId());
        modelingExerciseToBeConflicted.setId(123456789L);
        modelingExerciseRepository.save(modelingExerciseToBeConflicted);

        request.put("/api/modeling/modeling-exercises/" + classExercise.getId() + "/re-evaluate", modelingExerciseToBeConflicted, HttpStatus.CONFLICT);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testReEvaluateAndUpdateModelingExercise_notFound() throws Exception {
        request.put("/api/modeling/modeling-exercises/" + 123456789 + "/re-evaluate", classExercise, HttpStatus.NOT_FOUND);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void deleteModelingExerciseClustersAndElementsAsAdmin() throws Exception {
        final Course course = modelingExerciseUtilService.addCourseWithOneModelingExercise();
        ModelingExercise modelingExercise = modelingExerciseRepository.findByCourseIdWithCategories(course.getId()).getFirst();
        request.delete("/api/modeling/admin/modeling-exercises/" + modelingExercise.getId() + "/clusters", HttpStatus.OK);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void createModelingExercise_setInvalidExampleSolutionPublicationDate_badRequest() throws Exception {
        final var baseTime = ZonedDateTime.now();
        final Course course = modelingExerciseUtilService.addCourseWithOneModelingExercise();
        ModelingExercise modelingExercise = modelingExerciseRepository.findByCourseIdWithCategories(course.getId()).getFirst();
        modelingExercise.setId(null);
        modelingExercise.setAssessmentDueDate(null);
        modelingExercise.setIncludedInOverallScore(IncludedInOverallScore.INCLUDED_COMPLETELY);

        modelingExercise.setReleaseDate(baseTime.plusHours(1));
        modelingExercise.setDueDate(baseTime.plusHours(3));
        modelingExercise.setExampleSolutionPublicationDate(baseTime.plusHours(2));

        request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.BAD_REQUEST);

        modelingExercise.setReleaseDate(baseTime.plusHours(3));
        modelingExercise.setDueDate(null);
        modelingExercise.setExampleSolutionPublicationDate(baseTime.plusHours(2));

        request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.BAD_REQUEST);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void createModelingExercise_setValidExampleSolutionPublicationDate() throws Exception {
        final var baseTime = ZonedDateTime.now();
        final Course course = modelingExerciseUtilService.addCourseWithOneModelingExercise();
        ModelingExercise modelingExercise = modelingExerciseRepository.findByCourseIdWithCategories(course.getId()).getFirst();
        modelingExercise.setId(null);
        modelingExercise.setAssessmentDueDate(null);
        modelingExercise.setIncludedInOverallScore(IncludedInOverallScore.INCLUDED_COMPLETELY);

        modelingExercise.setReleaseDate(baseTime.plusHours(1));
        modelingExercise.setDueDate(baseTime.plusHours(2));
        var exampleSolutionPublicationDate = baseTime.plusHours(3);
        modelingExercise.setExampleSolutionPublicationDate(exampleSolutionPublicationDate);
        modelingExercise.setChannelName("testchannelname-" + UUID.randomUUID().toString().substring(0, 8));
        var result = request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.CREATED);
        assertThat(result.getExampleSolutionPublicationDate()).isEqualTo(exampleSolutionPublicationDate);

        modelingExercise.setIncludedInOverallScore(IncludedInOverallScore.NOT_INCLUDED);
        modelingExercise.setReleaseDate(baseTime.plusHours(1));
        modelingExercise.setDueDate(baseTime.plusHours(3));
        exampleSolutionPublicationDate = baseTime.plusHours(2);
        modelingExercise.setExampleSolutionPublicationDate(exampleSolutionPublicationDate);
        modelingExercise.setChannelName("testchannelname-" + UUID.randomUUID().toString().substring(0, 8));

        result = request.postWithResponseBody("/api/modeling/modeling-exercises", modelingExercise, ModelingExercise.class, HttpStatus.CREATED);
        assertThat(result.getExampleSolutionPublicationDate()).isEqualTo(exampleSolutionPublicationDate);

    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "student1", roles = "USER")
    void testGetModelingExercise_asStudent_exampleSolutionVisibility() throws Exception {
        testGetModelingExercise_exampleSolutionVisibility(true, TEST_PREFIX + "student1");
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testGetModelingExercise_asInstructor_exampleSolutionVisibility() throws Exception {
        testGetModelingExercise_exampleSolutionVisibility(false, TEST_PREFIX + "instructor1");
    }

    private void testGetModelingExercise_exampleSolutionVisibility(boolean isStudent, String username) throws Exception {
        // Utility function to avoid duplication
        Function<Course, ModelingExercise> modelingExerciseGetter = c -> (ModelingExercise) c.getExercises().stream().filter(e -> e.getId().equals(classExercise.getId())).findAny()
                .orElseThrow();

        classExercise.setExampleSolutionModel("<Sample solution model>");
        classExercise.setExampleSolutionExplanation("<Sample solution explanation>");

        if (isStudent) {
            participationUtilService.createAndSaveParticipationForExercise(classExercise, username);
        }

        // Test example solution publication date not set.
        classExercise.setExampleSolutionPublicationDate(null);
        modelingExerciseRepository.save(classExercise);

        CourseForDashboardDTO courseForDashboard = request.get("/api/core/courses/" + classExercise.getCourseViaExerciseGroupOrCourseMember().getId() + "/for-dashboard",
                HttpStatus.OK, CourseForDashboardDTO.class);
        Course course = courseForDashboard.course();
        ModelingExercise modelingExercise = modelingExerciseGetter.apply(course);

        if (isStudent) {
            assertThat(modelingExercise.getExampleSolutionModel()).isNull();
            assertThat(modelingExercise.getExampleSolutionExplanation()).isNull();
        }
        else {
            assertThat(modelingExercise.getExampleSolutionModel()).isEqualTo(classExercise.getExampleSolutionModel());
            assertThat(modelingExercise.getExampleSolutionExplanation()).isEqualTo(classExercise.getExampleSolutionExplanation());
        }

        // Test example solution publication date in the past.
        classExercise.setExampleSolutionPublicationDate(ZonedDateTime.now().minusHours(1));
        modelingExerciseRepository.save(classExercise);

        courseForDashboard = request.get("/api/core/courses/" + classExercise.getCourseViaExerciseGroupOrCourseMember().getId() + "/for-dashboard", HttpStatus.OK,
                CourseForDashboardDTO.class);
        course = courseForDashboard.course();
        modelingExercise = modelingExerciseGetter.apply(course);

        assertThat(modelingExercise.getExampleSolutionModel()).isEqualTo(classExercise.getExampleSolutionModel());
        assertThat(modelingExercise.getExampleSolutionExplanation()).isEqualTo(classExercise.getExampleSolutionExplanation());

        // Test example solution publication date in the future.
        classExercise.setExampleSolutionPublicationDate(ZonedDateTime.now().plusHours(1));
        modelingExerciseRepository.save(classExercise);

        courseForDashboard = request.get("/api/core/courses/" + classExercise.getCourseViaExerciseGroupOrCourseMember().getId() + "/for-dashboard", HttpStatus.OK,
                CourseForDashboardDTO.class);
        course = courseForDashboard.course();
        modelingExercise = modelingExerciseGetter.apply(course);

        if (isStudent) {
            assertThat(modelingExercise.getExampleSolutionModel()).isNull();
            assertThat(modelingExercise.getExampleSolutionExplanation()).isNull();
        }
        else {
            assertThat(modelingExercise.getExampleSolutionModel()).isEqualTo(classExercise.getExampleSolutionModel());
            assertThat(modelingExercise.getExampleSolutionExplanation()).isEqualTo(classExercise.getExampleSolutionExplanation());
        }
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void testImportModelingExercise_setGradingInstructionForCopiedFeedback() throws Exception {
        var now = ZonedDateTime.now();
        Course course1 = courseUtilService.addEmptyCourse();
        Course course2 = courseUtilService.addEmptyCourse();

        ModelingExercise modelingExercise = ModelingExerciseFactory.generateModelingExercise(now.minusDays(1), now.minusHours(2), now.minusHours(1), DiagramType.ClassDiagram,
                course1);
        modelingExercise = modelingExerciseRepository.save(modelingExercise);
        Set<GradingCriterion> gradingCriteria = exerciseUtilService.addGradingInstructionsToExercise(modelingExercise);
        gradingCriterionRepository.saveAll(gradingCriteria);
        GradingInstruction gradingInstruction = GradingCriterionUtil.findAnyInstructionWhere(gradingCriteria, instruction -> instruction.getFeedback() != null).orElseThrow();

        // Create example submission
        var exampleSubmission = participationUtilService.generateExampleSubmission("model", modelingExercise, true);
        exampleSubmission = participationUtilService.addExampleSubmission(exampleSubmission);
        participationUtilService.addResultToSubmission(exampleSubmission.getSubmission(), AssessmentType.MANUAL);
        var submission = submissionRepository.findWithEagerResultAndFeedbackAndAssessmentNoteById(exampleSubmission.getSubmission().getId()).orElseThrow();

        Feedback feedback = ParticipationFactory.generateFeedback().getFirst();
        feedback.setGradingInstruction(gradingInstruction);
        participationUtilService.addFeedbackToResult(feedback, Objects.requireNonNull(submission.getLatestResult()));
        modelingExercise.setChannelName("testchannel-" + UUID.randomUUID().toString().substring(0, 8));
        modelingExercise.setCourse(course2);
        var importedModelingExercise = request.postWithResponseBody("/api/modeling/modeling-exercises/import/" + modelingExercise.getId(), modelingExercise, ModelingExercise.class,
                HttpStatus.CREATED);

        assertThat(modelingExerciseRepository.findById(importedModelingExercise.getId())).isPresent();

        var importedExampleSubmission = importedModelingExercise.getExampleSubmissions().stream().findFirst().orElseThrow();
        GradingInstruction importedFeedbackGradingInstruction = importedExampleSubmission.getSubmission().getLatestResult().getFeedbacks().getFirst().getGradingInstruction();
        assertThat(importedFeedbackGradingInstruction).isNotNull();

        // Copy and original should have the same data but not the same ids.
        assertThat(importedFeedbackGradingInstruction.getId()).isNotEqualTo(gradingInstruction.getId());
        assertThat(importedFeedbackGradingInstruction.getGradingCriterion()).isNull(); // To avoid infinite recursion when serializing to JSON.
        assertThat(importedFeedbackGradingInstruction.getFeedback()).isEqualTo(gradingInstruction.getFeedback());
        assertThat(importedFeedbackGradingInstruction.getGradingScale()).isEqualTo(gradingInstruction.getGradingScale());
        assertThat(importedFeedbackGradingInstruction.getInstructionDescription()).isEqualTo(gradingInstruction.getInstructionDescription());
        assertThat(importedFeedbackGradingInstruction.getCredits()).isEqualTo(gradingInstruction.getCredits());
        assertThat(importedFeedbackGradingInstruction.getUsageCount()).isEqualTo(gradingInstruction.getUsageCount());

        var importedModelingExerciseFromDb = modelingExerciseRepository
                .findByIdWithExampleSubmissionsAndResultsAndPlagiarismDetectionConfigAndGradingCriteria(importedModelingExercise.getId()).orElseThrow();
        var importedFeedbackGradingInstructionFromDb = importedModelingExerciseFromDb.getExampleSubmissions().stream().findFirst().orElseThrow().getSubmission().getLatestResult()
                .getFeedbacks().getFirst().getGradingInstruction();

        assertThat(importedFeedbackGradingInstructionFromDb.getGradingCriterion().getId()).isNotEqualTo(gradingInstruction.getGradingCriterion().getId());

    }
}
