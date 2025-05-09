package de.tum.cit.aet.artemis.communication.notification;

import static de.tum.cit.aet.artemis.communication.domain.NotificationType.CONVERSATION_ADD_USER_CHANNEL;
import static de.tum.cit.aet.artemis.communication.domain.NotificationType.CONVERSATION_ADD_USER_GROUP_CHAT;
import static de.tum.cit.aet.artemis.communication.domain.NotificationType.CONVERSATION_CREATE_GROUP_CHAT;
import static de.tum.cit.aet.artemis.communication.domain.NotificationType.CONVERSATION_CREATE_ONE_TO_ONE_CHAT;
import static de.tum.cit.aet.artemis.communication.domain.NotificationType.CONVERSATION_DELETE_CHANNEL;
import static de.tum.cit.aet.artemis.communication.domain.NotificationType.CONVERSATION_NEW_REPLY_MESSAGE;
import static de.tum.cit.aet.artemis.communication.domain.NotificationType.CONVERSATION_REMOVE_USER_CHANNEL;
import static de.tum.cit.aet.artemis.communication.domain.NotificationType.CONVERSATION_REMOVE_USER_GROUP_CHAT;
import static de.tum.cit.aet.artemis.communication.domain.NotificationType.NEW_REPLY_FOR_EXERCISE_POST;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.CONVERSATION_ADD_USER_CHANNEL_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.CONVERSATION_ADD_USER_GROUP_CHAT_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.CONVERSATION_CREATE_GROUP_CHAT_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.CONVERSATION_DELETE_CHANNEL_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.CONVERSATION_REMOVE_USER_CHANNEL_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.CONVERSATION_REMOVE_USER_GROUP_CHAT_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.DATA_EXPORT_CREATED_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.DATA_EXPORT_FAILED_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.EXERCISE_SUBMISSION_ASSESSED_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.FILE_SUBMISSION_SUCCESSFUL_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.MESSAGE_REPLY_IN_CONVERSATION_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.NEW_PLAGIARISM_CASE_STUDENT_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.PLAGIARISM_CASE_VERDICT_STUDENT_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.SSH_KEY_ADDED_TEXT;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.SSH_KEY_EXPIRES_SOON_TEXT;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.SSH_KEY_HAS_EXPIRED_TEXT;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.TUTORIAL_GROUP_ASSIGNED_TEXT;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.TUTORIAL_GROUP_ASSIGNED_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.TUTORIAL_GROUP_DEREGISTRATION_STUDENT_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.TUTORIAL_GROUP_DEREGISTRATION_TUTOR_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.TUTORIAL_GROUP_REGISTRATION_MULTIPLE_TUTOR_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.TUTORIAL_GROUP_REGISTRATION_STUDENT_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.TUTORIAL_GROUP_REGISTRATION_TUTOR_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.TUTORIAL_GROUP_UNASSIGNED_TEXT;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.TUTORIAL_GROUP_UNASSIGNED_TITLE;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.VCS_ACCESS_TOKEN_ADDED_TEXT;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.VCS_ACCESS_TOKEN_EXPIRED_TEXT;
import static de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants.VCS_ACCESS_TOKEN_EXPIRES_SOON_TEXT;
import static de.tum.cit.aet.artemis.communication.service.notifications.NotificationSettingsService.NOTIFICATION_USER_NOTIFICATION_DATA_EXPORT_CREATED;
import static de.tum.cit.aet.artemis.communication.service.notifications.NotificationSettingsService.NOTIFICATION_USER_NOTIFICATION_DATA_EXPORT_FAILED;
import static de.tum.cit.aet.artemis.communication.service.notifications.NotificationSettingsService.NOTIFICATION__EXERCISE_NOTIFICATION__EXERCISE_SUBMISSION_ASSESSED;
import static de.tum.cit.aet.artemis.communication.service.notifications.NotificationSettingsService.NOTIFICATION__EXERCISE_NOTIFICATION__FILE_SUBMISSION_SUCCESSFUL;
import static de.tum.cit.aet.artemis.communication.service.notifications.NotificationSettingsService.NOTIFICATION__EXERCISE_NOTIFICATION__NEW_REPLY_FOR_EXERCISE_POST;
import static de.tum.cit.aet.artemis.communication.service.notifications.NotificationSettingsService.NOTIFICATION__TUTORIAL_GROUP_NOTIFICATION__TUTORIAL_GROUP_REGISTRATION;
import static de.tum.cit.aet.artemis.communication.service.notifications.NotificationSettingsService.NOTIFICATION__TUTOR_NOTIFICATION__TUTORIAL_GROUP_ASSIGN_UNASSIGN;
import static de.tum.cit.aet.artemis.communication.service.notifications.NotificationSettingsService.NOTIFICATION__TUTOR_NOTIFICATION__TUTORIAL_GROUP_REGISTRATION;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.anySet;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.apache.sshd.common.config.keys.AuthorizedKeyEntry;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.springframework.beans.factory.annotation.Autowired;

import de.tum.cit.aet.artemis.assessment.domain.AssessmentType;
import de.tum.cit.aet.artemis.assessment.domain.Result;
import de.tum.cit.aet.artemis.assessment.test_repository.ResultTestRepository;
import de.tum.cit.aet.artemis.communication.domain.AnswerPost;
import de.tum.cit.aet.artemis.communication.domain.ConversationParticipant;
import de.tum.cit.aet.artemis.communication.domain.NotificationSetting;
import de.tum.cit.aet.artemis.communication.domain.NotificationType;
import de.tum.cit.aet.artemis.communication.domain.Post;
import de.tum.cit.aet.artemis.communication.domain.conversation.Channel;
import de.tum.cit.aet.artemis.communication.domain.conversation.GroupChat;
import de.tum.cit.aet.artemis.communication.domain.conversation.OneToOneChat;
import de.tum.cit.aet.artemis.communication.domain.notification.Notification;
import de.tum.cit.aet.artemis.communication.domain.notification.SingleUserNotification;
import de.tum.cit.aet.artemis.communication.repository.NotificationSettingRepository;
import de.tum.cit.aet.artemis.communication.service.notifications.SingleUserNotificationService;
import de.tum.cit.aet.artemis.core.domain.Course;
import de.tum.cit.aet.artemis.core.domain.DataExport;
import de.tum.cit.aet.artemis.core.domain.DomainObject;
import de.tum.cit.aet.artemis.core.domain.User;
import de.tum.cit.aet.artemis.core.security.SecurityUtils;
import de.tum.cit.aet.artemis.core.test_repository.NotificationTestRepository;
import de.tum.cit.aet.artemis.core.user.util.UserUtilService;
import de.tum.cit.aet.artemis.core.util.CourseUtilService;
import de.tum.cit.aet.artemis.exercise.domain.Exercise;
import de.tum.cit.aet.artemis.exercise.participation.util.ParticipationUtilService;
import de.tum.cit.aet.artemis.fileupload.domain.FileUploadExercise;
import de.tum.cit.aet.artemis.fileupload.util.FileUploadExerciseUtilService;
import de.tum.cit.aet.artemis.lecture.domain.Lecture;
import de.tum.cit.aet.artemis.plagiarism.domain.PlagiarismCase;
import de.tum.cit.aet.artemis.plagiarism.domain.PlagiarismComparison;
import de.tum.cit.aet.artemis.plagiarism.domain.PlagiarismSubmission;
import de.tum.cit.aet.artemis.plagiarism.domain.PlagiarismVerdict;
import de.tum.cit.aet.artemis.plagiarism.domain.text.TextPlagiarismResult;
import de.tum.cit.aet.artemis.plagiarism.domain.text.TextSubmissionElement;
import de.tum.cit.aet.artemis.programming.dto.UserSshPublicKeyDTO;
import de.tum.cit.aet.artemis.programming.service.sshuserkeys.UserSshPublicKeyExpiryNotificationService;
import de.tum.cit.aet.artemis.programming.service.sshuserkeys.UserSshPublicKeyService;
import de.tum.cit.aet.artemis.programming.service.tokens.UserTokenExpiryNotificationService;
import de.tum.cit.aet.artemis.shared.base.AbstractSpringIntegrationIndependentTest;
import de.tum.cit.aet.artemis.text.domain.TextExercise;
import de.tum.cit.aet.artemis.text.util.TextExerciseFactory;
import de.tum.cit.aet.artemis.tutorialgroup.domain.TutorialGroup;

class SingleUserNotificationServiceTest extends AbstractSpringIntegrationIndependentTest {

    private static final String TEST_PREFIX = "singleusernotification";

    @Autowired
    private SingleUserNotificationService singleUserNotificationService;

    @Autowired
    private NotificationTestRepository notificationTestRepository;

    @Autowired
    private NotificationSettingRepository notificationSettingRepository;

    @Autowired
    private ResultTestRepository resultRepository;

    @Autowired
    private CourseUtilService courseUtilService;

    @Autowired
    private UserUtilService userUtilService;

    @Autowired
    private FileUploadExerciseUtilService fileUploadExerciseUtilService;

    @Autowired
    private ParticipationUtilService participationUtilService;

    @Autowired
    private UserSshPublicKeyExpiryNotificationService userSshPublicKeyExpiryNotificationService;

    @Autowired
    private UserTokenExpiryNotificationService userTokenExpiryNotificationService;

    @Autowired
    private UserSshPublicKeyService userSshPublicKeyService;

    @Captor
    private ArgumentCaptor<Notification> appleNotificationCaptor;

    @Captor
    private ArgumentCaptor<Notification> firebaseNotificationCaptor;

    private User user;

    private User userTwo;

    private User userThree;

    private FileUploadExercise fileUploadExercise;

    private Post post;

    private static final String POST_TITLE = "post title";

    private static final String POST_CONTENT = "post content";

    private AnswerPost answerPost;

    private static final String ANSWER_POST_CONTENT = "answer post content";

    private Course course;

    private static final String COURSE_TITLE = "course title";

    private static final String LECTURE_TITLE = "lecture title";

    private Exercise exercise;

    private PlagiarismCase plagiarismCase;

    private Result result;

    private TutorialGroup tutorialGroup;

    private OneToOneChat oneToOneChat;

    private GroupChat groupChat;

    private Channel channel;

    private DataExport dataExport;

    /**
     * Sets up all needed mocks and their wanted behavior
     */
    @BeforeEach
    void setUp() {
        SecurityUtils.setAuthorizationObject();

        course = courseUtilService.createCourse();
        course.setTitle(COURSE_TITLE);

        userUtilService.addUsers(TEST_PREFIX, 3, 0, 0, 0);
        user = userUtilService.getUserByLogin(TEST_PREFIX + "student1");
        userTwo = userUtilService.getUserByLogin(TEST_PREFIX + "student2");
        userThree = userUtilService.getUserByLogin(TEST_PREFIX + "student3");

        notificationTestRepository.deleteAllInBatch();

        exercise = new TextExercise();
        exercise.setCourse(course);
        exercise.setMaxPoints(10D);

        fileUploadExercise = new FileUploadExercise();
        fileUploadExercise.setCourse(course);

        Lecture lecture = new Lecture();
        lecture.setCourse(course);
        lecture.setTitle(LECTURE_TITLE);

        channel = new Channel();
        channel.setCourse(course);
        channel.setName("test");
        channel.setCreator(userTwo);
        channel.setCreationDate(ZonedDateTime.now());

        post = new Post();
        post.setId(1L);
        post.setAuthor(userTwo);
        post.setConversation(channel);
        post.setTitle(POST_TITLE);
        post.setContent(POST_CONTENT);

        Post answerPostPost = new Post();
        answerPostPost.setConversation(channel);
        answerPostPost.setAuthor(userTwo);
        answerPostPost.setId(2L);
        answerPost = new AnswerPost();
        answerPost.setId(1L);
        answerPost.setPost(answerPostPost);
        answerPost.setAuthor(userThree);
        answerPost.setContent(ANSWER_POST_CONTENT);

        PlagiarismSubmission<TextSubmissionElement> plagiarismSubmission = new PlagiarismSubmission<>();
        plagiarismSubmission.setStudentLogin(user.getLogin());

        TextPlagiarismResult plagiarismResult = new TextPlagiarismResult();
        plagiarismResult.setExercise(exercise);

        PlagiarismComparison<TextSubmissionElement> plagiarismComparison = new PlagiarismComparison<>();
        plagiarismComparison.setSubmissionA(plagiarismSubmission);
        plagiarismComparison.setPlagiarismResult(plagiarismResult);

        plagiarismCase = new PlagiarismCase();
        plagiarismCase.setExercise(exercise);

        result = new Result();
        result.setScore(1D);
        result.setCompletionDate(ZonedDateTime.now().minusMinutes(1));

        tutorialGroup = new TutorialGroup();
        tutorialGroup.setCourse(course);
        tutorialGroup.setTeachingAssistant(userTwo);

        oneToOneChat = new OneToOneChat();
        oneToOneChat.setCourse(course);
        oneToOneChat.setCreator(userTwo);
        oneToOneChat.setCreationDate(ZonedDateTime.now());
        ConversationParticipant conversationParticipant1 = new ConversationParticipant();
        conversationParticipant1.setUser(user);
        ConversationParticipant conversationParticipant2 = new ConversationParticipant();
        conversationParticipant2.setUser(userTwo);
        oneToOneChat.setConversationParticipants(Set.of(conversationParticipant1, conversationParticipant2));

        groupChat = new GroupChat();
        groupChat.setCourse(course);
        groupChat.setCreator(userTwo);
        groupChat.setCreationDate(ZonedDateTime.now());
        ConversationParticipant conversationParticipant3 = new ConversationParticipant();
        conversationParticipant3.setUser(userThree);
        groupChat.setConversationParticipants(Set.of(conversationParticipant1, conversationParticipant2, conversationParticipant3));

        channel.setConversationParticipants(Set.of(conversationParticipant1, conversationParticipant2, conversationParticipant3));

        dataExport = new DataExport();
        dataExport.setUser(user);
    }

    /**
     * Auxiliary method that checks if the groupNotificationRepository was called once successfully with the correct notification (type)
     *
     * @param expectedNotificationTitle is the title (NotificationTitleTypeConstants) of the expected notification
     */
    private void verifyRepositoryCallWithCorrectNotification(String expectedNotificationTitle) {
        List<Notification> capturedNotifications = notificationTestRepository.findAll();
        assertThat(capturedNotifications).isNotEmpty();
        List<Notification> relevantNotifications = capturedNotifications.stream().filter(e -> e.getTitle().equals(expectedNotificationTitle)).toList();
        assertThat(relevantNotifications).as("Title of the captured notification should be equal to the expected one").hasSize(1);
    }

    /// General notify Tests

    /**
     * Tests if no notification (or email) is sent if the settings are deactivated
     * However, the notification has to be saved to the DB
     */
    @Test
    void testSendNoNotificationOrEmailWhenSettingsAreDeactivated() {
        notificationSettingRepository.save(new NotificationSetting(user, false, true, true, NOTIFICATION__EXERCISE_NOTIFICATION__NEW_REPLY_FOR_EXERCISE_POST));
        assertThat(notificationTestRepository.findAll()).as("No notifications should be present prior to the method call").isEmpty();

        SingleUserNotification notification = singleUserNotificationService.createNotificationAboutNewMessageReply(answerPost, answerPost.getAuthor(),
                answerPost.getPost().getConversation());
        singleUserNotificationService.notifyUserAboutNewMessageReply(answerPost, notification, user, userTwo, NEW_REPLY_FOR_EXERCISE_POST);

        assertThat(notificationTestRepository.findAll()).as("The notification should have been saved to the DB").hasSize(1);
        // no web app notification or email should be sent
        verify(websocketMessagingService, never()).sendMessage(any(), any());
    }

    /**
     * Test for notifyUserAboutSuccessfulFileUploadSubmission method
     */
    @Test
    void testNotifyUserAboutSuccessfulFileUploadSubmission() {
        notificationSettingRepository.save(new NotificationSetting(user, true, true, true, NOTIFICATION__EXERCISE_NOTIFICATION__FILE_SUBMISSION_SUCCESSFUL));
        singleUserNotificationService.notifyUserAboutSuccessfulFileUploadSubmission(fileUploadExercise, user);
        verifyRepositoryCallWithCorrectNotification(FILE_SUBMISSION_SUCCESSFUL_TITLE);
        verifyEmail();
    }

    // AssessedExerciseSubmission related

    /**
     * Test for notifyUserAboutAssessedExerciseSubmission method
     */
    @Test
    void testNotifyUserAboutAssessedExerciseSubmission() {
        NotificationSetting notificationSetting = new NotificationSetting(user, true, true, true, NOTIFICATION__EXERCISE_NOTIFICATION__EXERCISE_SUBMISSION_ASSESSED);
        notificationSettingRepository.save(notificationSetting);

        singleUserNotificationService.checkNotificationForAssessmentExerciseSubmission(exercise, user, result);

        verifyRepositoryCallWithCorrectNotification(EXERCISE_SUBMISSION_ASSESSED_TITLE);
        verifyEmail();
    }

    /**
     * Test for checkNotificationForExerciseRelease method with a past assessment due date
     */
    @Test
    void testCheckNotificationForAssessmentExerciseSubmission_pastAssessmentDueDate() {
        exercise = TextExerciseFactory.generateTextExercise(null, null, ZonedDateTime.now().minusMinutes(1), course);
        singleUserNotificationService.checkNotificationForAssessmentExerciseSubmission(exercise, user, result);
        assertThat(notificationTestRepository.findAll()).as("One new notification should have been created").hasSize(1);
    }

    /**
     * Test for checkNotificationForExerciseRelease method with a future release date
     */
    @Test
    void testCheckNotificationForAssessmentExerciseSubmission_futureAssessmentDueDate() {
        exercise = TextExerciseFactory.generateTextExercise(null, null, ZonedDateTime.now().plusHours(1), course);
        singleUserNotificationService.checkNotificationForAssessmentExerciseSubmission(exercise, user, result);
        assertThat(notificationTestRepository.findAll()).as("No new notification should have been created").isEmpty();
    }

    @Test
    void testNotifyUsersAboutAssessedExerciseSubmission() {
        Course testCourse = fileUploadExerciseUtilService.addCourseWithFileUploadExercise();
        Exercise testExercise = testCourse.getExercises().iterator().next();

        User studentWithParticipationAndSubmissionAndAutomaticResult = userUtilService.getUserByLogin(TEST_PREFIX + "student1");
        User studentWithParticipationAndSubmissionAndManualResult = userUtilService.getUserByLogin(TEST_PREFIX + "student2");
        User studentWithParticipationButWithoutSubmission = userUtilService.getUserByLogin(TEST_PREFIX + "student3");

        participationUtilService.createParticipationSubmissionAndResult(testExercise.getId(), studentWithParticipationAndSubmissionAndAutomaticResult, 10.0, 10.0, 50, true);
        Result manualResult = participationUtilService.createParticipationSubmissionAndResult(testExercise.getId(), studentWithParticipationAndSubmissionAndManualResult, 10.0,
                10.0, 50, true);
        manualResult.setAssessmentType(AssessmentType.MANUAL);
        resultRepository.save(manualResult);
        participationUtilService.createAndSaveParticipationForExercise(testExercise, studentWithParticipationButWithoutSubmission.getLogin());

        testExercise = exerciseRepository.findAllExercisesByCourseId(testCourse.getId()).iterator().next();

        singleUserNotificationService.notifyUsersAboutAssessedExerciseSubmission(testExercise);

        List<Notification> sentNotifications = notificationTestRepository.findAll();

        assertThat(sentNotifications).as("Only one notification should have been created (for the user with a valid participation, submission, and manual result)").hasSize(1);
        assertThat(sentNotifications.getFirst()).isInstanceOf(SingleUserNotification.class);
        assertThat(((SingleUserNotification) sentNotifications.getFirst()).getRecipient()).isEqualTo(studentWithParticipationAndSubmissionAndManualResult);
    }

    // UserSshPublicKey related (expiry warning and newly created key)

    @Nested
    class UserSshPublicKeyExpiryNotification {

        String RSA_KEY = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEbgjoSpKnry5yuMiWh/uwhMG2Jq5Sh8Uw9vz+39or2i";

        long KEY_ID = 4L;

        String KEY_LABEL = "key ";

        List<Notification> sentNotifications;

        @AfterEach
        void tearDown() {
            userSshPublicKeyRepository.deleteAll();
        }

        @Test
        void shouldNotifyUserAboutNewlyCreatedSshKeyWithExpirationDate() throws GeneralSecurityException, IOException {
            UserSshPublicKeyDTO keyDTO = new UserSshPublicKeyDTO(KEY_ID, KEY_LABEL, RSA_KEY, null, null, null, null);

            userSshPublicKeyService.createSshKeyForUser(user, AuthorizedKeyEntry.parseAuthorizedKeyEntry(keyDTO.publicKey()), keyDTO);

            sentNotifications = notificationTestRepository.findAllByRecipientId(user.getId());
            checkFirstNotification();
        }

        @Test
        void shouldNotifyUserAboutNewlyCreatedSshKeyWithNoDate() throws GeneralSecurityException, IOException {
            UserSshPublicKeyDTO keyDTO = new UserSshPublicKeyDTO(KEY_ID, KEY_LABEL, RSA_KEY, null, null, null, ZonedDateTime.now().plusDays(15));

            userSshPublicKeyService.createSshKeyForUser(user, AuthorizedKeyEntry.parseAuthorizedKeyEntry(keyDTO.publicKey()), keyDTO);

            sentNotifications = notificationTestRepository.findAllByRecipientId(user.getId());
            checkFirstNotification();
        }

        @Test
        void shouldNotifyUserAboutUpcomingSshKeyExpiry() throws GeneralSecurityException, IOException {
            UserSshPublicKeyDTO keyDTO = new UserSshPublicKeyDTO(KEY_ID, KEY_LABEL, RSA_KEY, null, null, null, ZonedDateTime.now().plusDays(6));
            userSshPublicKeyService.createSshKeyForUser(user, AuthorizedKeyEntry.parseAuthorizedKeyEntry(keyDTO.publicKey()), keyDTO);

            userSshPublicKeyExpiryNotificationService.notifyUserOnUpcomingKeyExpiry();

            sentNotifications = notificationTestRepository.findAllByRecipientId(user.getId());
            assertThat(sentNotifications).hasSize(2);
            assertThat(((SingleUserNotification) sentNotifications.getFirst()).getRecipient()).isEqualTo(user);
            assertThat((sentNotifications.get(1)).getText()).isEqualTo(SSH_KEY_EXPIRES_SOON_TEXT);
            checkFirstNotification();
        }

        @Test
        void shouldNotifyUserAboutExpiredSshKey() throws GeneralSecurityException, IOException {
            UserSshPublicKeyDTO keyDTO = new UserSshPublicKeyDTO(KEY_ID, KEY_LABEL, RSA_KEY, null, null, null, ZonedDateTime.now().minusDays(1));
            userSshPublicKeyService.createSshKeyForUser(user, AuthorizedKeyEntry.parseAuthorizedKeyEntry(keyDTO.publicKey()), keyDTO);

            userSshPublicKeyExpiryNotificationService.notifyUserOnExpiredKey();

            sentNotifications = notificationTestRepository.findAllByRecipientId(user.getId());
            assertThat(sentNotifications).hasSize(2);
            assertThat(((SingleUserNotification) sentNotifications.getFirst()).getRecipient()).isEqualTo(user);
            assertThat((sentNotifications.get(1)).getText()).isEqualTo(SSH_KEY_HAS_EXPIRED_TEXT);
            checkFirstNotification();
        }

        @Test
        void shouldNotNotifyUserAboutUpcomingSshKeyExpiryWhenKeyDoesNotExpireSoon() throws GeneralSecurityException, IOException {
            UserSshPublicKeyDTO keyDTO = new UserSshPublicKeyDTO(KEY_ID, KEY_LABEL, RSA_KEY, null, null, null, ZonedDateTime.now().plusDays(100));
            userSshPublicKeyService.createSshKeyForUser(user, AuthorizedKeyEntry.parseAuthorizedKeyEntry(keyDTO.publicKey()), keyDTO);

            userSshPublicKeyExpiryNotificationService.notifyUserOnUpcomingKeyExpiry();

            sentNotifications = notificationTestRepository.findAllByRecipientId(user.getId());
            assertThat(sentNotifications).hasSize(1);
            checkFirstNotification();
        }

        @Test
        void shouldNotNotifyUserAboutExpiredSshKeyWhenKeyIsNotExpired() throws GeneralSecurityException, IOException {
            UserSshPublicKeyDTO keyDTO = new UserSshPublicKeyDTO(KEY_ID, KEY_LABEL, RSA_KEY, null, null, null, ZonedDateTime.now().plusDays(100));
            userSshPublicKeyService.createSshKeyForUser(user, AuthorizedKeyEntry.parseAuthorizedKeyEntry(keyDTO.publicKey()), keyDTO);

            userSshPublicKeyExpiryNotificationService.notifyUserOnExpiredKey();

            sentNotifications = notificationTestRepository.findAllByRecipientId(user.getId());
            assertThat(sentNotifications).hasSize(1);
            checkFirstNotification();
        }

        @Test
        void scheduleKeyExpiryNotifications() {
            userSshPublicKeyExpiryNotificationService.sendKeyExpirationNotifications();

            sentNotifications = notificationTestRepository.findAllByRecipientId(user.getId());
            assertThat(sentNotifications).hasSize(0);
        }

        void checkFirstNotification() {
            assertThat(sentNotifications.getFirst()).isInstanceOf(SingleUserNotification.class);
            assertThat(((SingleUserNotification) sentNotifications.getFirst()).getRecipient()).isEqualTo(user);
            assertThat((sentNotifications.getFirst()).getText()).isEqualTo(SSH_KEY_ADDED_TEXT);
        }
    }

    // User VCS access token related (expiry warning and newly added token)

    @Nested
    class UserTokenExpiryNotification {

        List<Notification> sentNotifications;

        @AfterEach
        void tearDown() throws Exception {
            user.setVcsAccessTokenExpiryDate(null);
            user.setVcsAccessToken(null);
            userTestRepository.save(user);
        }

        @Test
        void shouldNotifyUserAboutNewlyAddedVcsAccessToken() {
            singleUserNotificationService.notifyUserAboutNewlyAddedVcsAccessToken(user);

            sentNotifications = notificationTestRepository.findAll();
            assertThat(sentNotifications.getFirst()).isInstanceOf(SingleUserNotification.class);
            assertThat(((SingleUserNotification) sentNotifications.getFirst()).getRecipient()).isEqualTo(user);
            assertThat((sentNotifications.getFirst()).getText()).isEqualTo(VCS_ACCESS_TOKEN_ADDED_TEXT);
        }

        @Test
        void shouldNotifyUserAboutSoonExpiringVcsAccessToken() {
            user.setVcsAccessToken("token");
            user.setVcsAccessTokenExpiryDate(ZonedDateTime.now().minusHours(5).plusDays(7));
            userTestRepository.save(user);

            userTokenExpiryNotificationService.sendTokenExpirationNotifications();

            sentNotifications = notificationTestRepository.findAll();
            assertThat(sentNotifications).hasSize(1);
            assertThat(sentNotifications.getFirst()).isInstanceOf(SingleUserNotification.class);
            assertThat(((SingleUserNotification) sentNotifications.getFirst()).getRecipient()).isEqualTo(user);
            assertThat((sentNotifications.getFirst()).getText()).isEqualTo(VCS_ACCESS_TOKEN_EXPIRES_SOON_TEXT);
        }

        @Test
        void shouldNotifyUserAboutExpiredVcsAccessToken() {
            user.setVcsAccessToken("token");
            user.setVcsAccessTokenExpiryDate(ZonedDateTime.now().minusHours(5));
            userTestRepository.save(user);

            userTokenExpiryNotificationService.sendTokenExpirationNotifications();

            sentNotifications = notificationTestRepository.findAll();
            assertThat(sentNotifications).hasSize(1);
            assertThat(sentNotifications.getFirst()).isInstanceOf(SingleUserNotification.class);
            assertThat(((SingleUserNotification) sentNotifications.getFirst()).getRecipient()).isEqualTo(user);
            assertThat((sentNotifications.getFirst()).getText()).isEqualTo(VCS_ACCESS_TOKEN_EXPIRED_TEXT);
        }

        @Test
        void shouldNotNotifyUserAboutVcsAccessTokenExpiryWhenTokenIsNotExpired() {
            user.setVcsAccessToken("token");
            user.setVcsAccessTokenExpiryDate(ZonedDateTime.now().plusDays(5));
            userTestRepository.save(user);

            userTokenExpiryNotificationService.sendTokenExpirationNotifications();

            sentNotifications = notificationTestRepository.findAll();
            assertThat(sentNotifications).hasSize(0);
        }
    }

    // Plagiarism related

    /**
     * Test for notifyUserAboutNewPossiblePlagiarismCase method
     */
    @Test
    void testNotifyUserAboutNewPossiblePlagiarismCase() throws MessagingException, IOException {
        // explicitly change the user to prevent issues in the following server call due to userRepository.getUser() (@WithMockUser is not working here)
        userUtilService.changeUser(TEST_PREFIX + "student1");
        String exerciseTitle = "Test New Plagiarism";
        exercise.setTitle(exerciseTitle);
        post.setPlagiarismCase(plagiarismCase);
        plagiarismCase.setPost(post);
        singleUserNotificationService.notifyUserAboutNewPlagiarismCase(plagiarismCase, user);
        verifyRepositoryCallWithCorrectNotification(NEW_PLAGIARISM_CASE_STUDENT_TITLE);
        ArgumentCaptor<MimeMessage> mimeMessageCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(javaMailSender, timeout(1000)).send(mimeMessageCaptor.capture());
        assertThat(mimeMessageCaptor.getValue().getSubject()).isEqualTo("New Plagiarism Case: Exercise \"" + exerciseTitle + "\" in the course \"" + course.getTitle() + "\"");
        assertThat(mimeMessageCaptor.getValue().getContent()).asString().contains(POST_CONTENT);
    }

    /**
     * Test for notifyUserAboutFinalPlagiarismState method
     */
    @Test
    void testNotifyUserAboutFinalPlagiarismState() throws MessagingException, IOException {
        // explicitly change the user to prevent issues in the following server call due to userRepository.getUser() (@WithMockUser is not working here)
        userUtilService.changeUser(TEST_PREFIX + "student1");
        plagiarismCase.setVerdict(PlagiarismVerdict.NO_PLAGIARISM);
        singleUserNotificationService.notifyUserAboutPlagiarismCaseVerdict(plagiarismCase, user);
        verifyRepositoryCallWithCorrectNotification(PLAGIARISM_CASE_VERDICT_STUDENT_TITLE);
        ArgumentCaptor<MimeMessage> mimeMessageCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(javaMailSender, timeout(1000)).send(mimeMessageCaptor.capture());
        assertThat(mimeMessageCaptor.getValue().getSubject()).isEqualTo("Verdict for your plagiarism case");
        assertThat(mimeMessageCaptor.getValue().getContent()).asString().contains("Verdict reached in plagiarism case for exercise");
    }

    @Test
    void testConversationNotificationsOneToOneChatCreation() {
        var notificationsBefore = (int) notificationTestRepository.count();
        singleUserNotificationService.notifyClientAboutConversationCreationOrDeletion(oneToOneChat, user, userTwo, CONVERSATION_CREATE_ONE_TO_ONE_CHAT);
        List<Notification> capturedNotifications = notificationTestRepository.findAll();
        assertThat(capturedNotifications).as("Notification should not have been saved").hasSize(notificationsBefore);
        // notification should be sent
        verify(websocketMessagingService).sendMessage(eq("/topic/user/" + user.getId() + "/notifications"), (Object) any());
    }

    @Test
    void testConversationNotificationsGroupChatCreation() {
        int notificationsBefore = (int) notificationTestRepository.count();
        singleUserNotificationService.notifyClientAboutConversationCreationOrDeletion(groupChat, user, userTwo, CONVERSATION_CREATE_GROUP_CHAT);
        verify(websocketMessagingService).sendMessage(eq("/topic/user/" + user.getId() + "/notifications"), (Object) any());

        singleUserNotificationService.notifyClientAboutConversationCreationOrDeletion(groupChat, userThree, userTwo, CONVERSATION_CREATE_GROUP_CHAT);
        verify(websocketMessagingService).sendMessage(eq("/topic/user/" + userThree.getId() + "/notifications"), (Object) any());

        List<Notification> capturedNotifications = notificationTestRepository.findAll();
        assertThat(capturedNotifications).as("Both notifications should have been saved").hasSize(notificationsBefore + 2);
        capturedNotifications.forEach(capturedNotification -> {
            assertThat(capturedNotification.getTitle()).as("Title of the captured notification should be equal to the expected one")
                    .isEqualTo(CONVERSATION_CREATE_GROUP_CHAT_TITLE);
        });
    }

    @ParameterizedTest
    @MethodSource("getNotificationTypesAndTitlesParametersForGroupChat")
    void testConversationNotificationsGroupChatAddAndRemoveUsers(NotificationType notificationType, String expectedTitle) {
        singleUserNotificationService.notifyClientAboutConversationCreationOrDeletion(groupChat, user, userTwo, notificationType);
        verify(websocketMessagingService).sendMessage(eq("/topic/user/" + user.getId() + "/notifications"), (Object) any());

        verifyRepositoryCallWithCorrectNotification(expectedTitle);
    }

    @ParameterizedTest
    @MethodSource("getNotificationTypesAndTitlesParametersForChannel")
    void testConversationNotificationsChannel(NotificationType notificationType, String expectedTitle) throws InterruptedException {
        singleUserNotificationService.notifyClientAboutConversationCreationOrDeletion(channel, user, userTwo, notificationType);
        verify(websocketMessagingService, timeout(2000)).sendMessage(eq("/topic/user/" + user.getId() + "/notifications"), (Object) any());

        verifyRepositoryCallWithCorrectNotification(expectedTitle);
    }

    @Test
    void testConversationNotificationsNewMessageReply() {
        Post post = new Post();
        post.setId(1L);
        post.setAuthor(user);
        post.setCreationDate(ZonedDateTime.now());
        post.setConversation(groupChat);

        AnswerPost answerPost = new AnswerPost();
        answerPost.setId(1L);
        answerPost.setAuthor(userTwo);
        answerPost.setCreationDate(ZonedDateTime.now().plusSeconds(5));
        answerPost.setPost(post);

        SingleUserNotification notification = singleUserNotificationService.createNotificationAboutNewMessageReply(answerPost, answerPost.getAuthor(),
                answerPost.getPost().getConversation());
        singleUserNotificationService.notifyUserAboutNewMessageReply(answerPost, notification, user, userTwo, CONVERSATION_NEW_REPLY_MESSAGE);
        verify(websocketMessagingService, never()).sendMessage(eq("/topic/user/" + user.getId() + "/notifications"), (Object) any());
        Notification sentNotification = notificationTestRepository.findAll().stream().max(Comparator.comparing(DomainObject::getId)).orElseThrow();

        SingleUserNotificationService.NewReplyNotificationSubject notificationSubject = new SingleUserNotificationService.NewReplyNotificationSubject(answerPost, user, userTwo);
        verify(generalInstantNotificationService, times(1)).sendNotification(sentNotification, user, notificationSubject);

        verifyRepositoryCallWithCorrectNotification(MESSAGE_REPLY_IN_CONVERSATION_TITLE);
    }

    // Tutorial Group related

    @Test
    void testTutorialGroupNotifications_studentRegistration() {
        notificationSettingRepository.deleteAll();
        notificationSettingRepository.save(new NotificationSetting(user, true, true, true, NOTIFICATION__TUTORIAL_GROUP_NOTIFICATION__TUTORIAL_GROUP_REGISTRATION));
        singleUserNotificationService.notifyStudentAboutRegistrationToTutorialGroup(tutorialGroup, user, userTwo);
        verifyRepositoryCallWithCorrectNotification(TUTORIAL_GROUP_REGISTRATION_STUDENT_TITLE);
        verifyEmail();
    }

    @Test
    void testTutorialGroupNotifications_studentDeregistration() {
        notificationSettingRepository.deleteAll();
        notificationSettingRepository.save(new NotificationSetting(user, true, true, true, NOTIFICATION__TUTORIAL_GROUP_NOTIFICATION__TUTORIAL_GROUP_REGISTRATION));
        singleUserNotificationService.notifyStudentAboutDeregistrationFromTutorialGroup(tutorialGroup, user, userTwo);
        verifyRepositoryCallWithCorrectNotification(TUTORIAL_GROUP_DEREGISTRATION_STUDENT_TITLE);
        verifyEmail();
    }

    @Test
    void testTutorialGroupNotifications_tutorRegistration() {
        notificationSettingRepository.deleteAll();
        notificationSettingRepository
                .save(new NotificationSetting(tutorialGroup.getTeachingAssistant(), true, true, true, NOTIFICATION__TUTOR_NOTIFICATION__TUTORIAL_GROUP_REGISTRATION));
        singleUserNotificationService.notifyTutorAboutRegistrationToTutorialGroup(tutorialGroup, user, userThree);
        verifyRepositoryCallWithCorrectNotification(TUTORIAL_GROUP_REGISTRATION_TUTOR_TITLE);
        verifyEmail();

    }

    @Test
    void testTutorialGroupNotifications_tutorRegistrationMultiple() {
        notificationSettingRepository.deleteAll();
        notificationSettingRepository
                .save(new NotificationSetting(tutorialGroup.getTeachingAssistant(), true, true, true, NOTIFICATION__TUTOR_NOTIFICATION__TUTORIAL_GROUP_REGISTRATION));
        singleUserNotificationService.notifyTutorAboutMultipleRegistrationsToTutorialGroup(tutorialGroup, Set.of(user), userThree);
        verifyRepositoryCallWithCorrectNotification(TUTORIAL_GROUP_REGISTRATION_MULTIPLE_TUTOR_TITLE);
        verifyEmail();
    }

    @Test
    void testTutorialGroupNotifications_tutorDeregistration() {
        notificationSettingRepository.deleteAll();
        notificationSettingRepository
                .save(new NotificationSetting(tutorialGroup.getTeachingAssistant(), true, true, true, NOTIFICATION__TUTOR_NOTIFICATION__TUTORIAL_GROUP_REGISTRATION));
        singleUserNotificationService.notifyTutorAboutDeregistrationFromTutorialGroup(tutorialGroup, user, userThree);
        verifyRepositoryCallWithCorrectNotification(TUTORIAL_GROUP_DEREGISTRATION_TUTOR_TITLE);
        verifyEmail();
    }

    @Test
    void testTutorialGroupNotifications_groupAssigned() {
        notificationSettingRepository.deleteAll();
        User teachingAssistant = tutorialGroup.getTeachingAssistant();
        notificationSettingRepository.save(new NotificationSetting(teachingAssistant, true, true, true, NOTIFICATION__TUTOR_NOTIFICATION__TUTORIAL_GROUP_ASSIGN_UNASSIGN));
        singleUserNotificationService.notifyTutorAboutAssignmentToTutorialGroup(tutorialGroup, tutorialGroup.getTeachingAssistant(), userThree);
        verifyRepositoryCallWithCorrectNotification(TUTORIAL_GROUP_ASSIGNED_TITLE);
        verifyEmail();
        verifyPush(1, TUTORIAL_GROUP_ASSIGNED_TEXT, teachingAssistant);

    }

    @Test
    void testTutorialGroupNotifications_groupUnassigned() {
        notificationSettingRepository.deleteAll();
        User teachingAssistant = tutorialGroup.getTeachingAssistant();
        notificationSettingRepository.save(new NotificationSetting(teachingAssistant, true, true, true, NOTIFICATION__TUTOR_NOTIFICATION__TUTORIAL_GROUP_ASSIGN_UNASSIGN));
        singleUserNotificationService.notifyTutorAboutUnassignmentFromTutorialGroup(tutorialGroup, tutorialGroup.getTeachingAssistant(), userThree);
        verifyRepositoryCallWithCorrectNotification(TUTORIAL_GROUP_UNASSIGNED_TITLE);
        verifyEmail();
        verifyPush(1, TUTORIAL_GROUP_UNASSIGNED_TEXT, teachingAssistant);
    }

    @Test
    void testDataExportNotification_dataExportCreated() {
        notificationSettingRepository.save(new NotificationSetting(user, true, true, true, NOTIFICATION_USER_NOTIFICATION_DATA_EXPORT_CREATED));
        singleUserNotificationService.notifyUserAboutDataExportCreation(dataExport);
        verifyRepositoryCallWithCorrectNotification(DATA_EXPORT_CREATED_TITLE);
        verifyEmail();
    }

    @Test
    void testDataExportNotification_dataExportFailed() {
        notificationSettingRepository.save(new NotificationSetting(user, true, true, true, NOTIFICATION_USER_NOTIFICATION_DATA_EXPORT_FAILED));
        singleUserNotificationService.notifyUserAboutDataExportFailure(dataExport);
        verifyRepositoryCallWithCorrectNotification(DATA_EXPORT_FAILED_TITLE);
        verifyEmail();
    }

    /**
     * Checks if an email was created and sent
     */
    private void verifyEmail() {
        verify(javaMailSender, timeout(1000)).send(any(MimeMessage.class));
    }

    /**
     * Checks if a push to android and iOS was created and send
     *
     * @param times how often the email should have been sent
     */
    private void verifyPush(int times, String text, User recipient) {
        verify(applePushNotificationService, timeout(1500).atLeast(times)).sendNotification(appleNotificationCaptor.capture(), anySet(), any(Object.class));
        verify(firebasePushNotificationService, timeout(1500).atLeast(times)).sendNotification(firebaseNotificationCaptor.capture(), anySet(), any(Object.class));

        List<SingleUserNotification> appleNotifications = filterRelevantNotifications(appleNotificationCaptor.getAllValues(), text, recipient);
        assertThat(appleNotifications).as(times + " Apple notifications should have been sent").hasSize(times);

        List<SingleUserNotification> firebaseNotifications = filterRelevantNotifications(firebaseNotificationCaptor.getAllValues(), text, recipient);
        assertThat(firebaseNotifications).as(times + " Firebase notifications should have been sent").hasSize(times);
    }

    private List<SingleUserNotification> filterRelevantNotifications(List<Notification> notifications, String title, User recipient) {
        return notifications.stream().filter(notification -> notification instanceof SingleUserNotification).map(notification -> (SingleUserNotification) notification)
                .filter(notification -> title.equals(notification.getText()) && recipient.getId().equals(notification.getRecipient().getId())).toList();
    }

    private static Stream<Arguments> getNotificationTypesAndTitlesParametersForGroupChat() {
        return Stream.of(Arguments.of(CONVERSATION_ADD_USER_GROUP_CHAT, CONVERSATION_ADD_USER_GROUP_CHAT_TITLE),
                Arguments.of(CONVERSATION_REMOVE_USER_GROUP_CHAT, CONVERSATION_REMOVE_USER_GROUP_CHAT_TITLE));
    }

    private static Stream<Arguments> getNotificationTypesAndTitlesParametersForChannel() {
        return Stream.of(Arguments.of(CONVERSATION_ADD_USER_CHANNEL, CONVERSATION_ADD_USER_CHANNEL_TITLE),
                Arguments.of(CONVERSATION_REMOVE_USER_CHANNEL, CONVERSATION_REMOVE_USER_CHANNEL_TITLE),
                Arguments.of(CONVERSATION_DELETE_CHANNEL, CONVERSATION_DELETE_CHANNEL_TITLE));
    }
}
