package de.tum.cit.aet.artemis.communication.notifications.service.push_notifications;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.anySet;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.Date;
import java.util.HexFormat;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import de.tum.cit.aet.artemis.communication.domain.GroupNotificationType;
import de.tum.cit.aet.artemis.communication.domain.notification.GroupNotification;
import de.tum.cit.aet.artemis.communication.domain.notification.Notification;
import de.tum.cit.aet.artemis.communication.domain.notification.NotificationConstants;
import de.tum.cit.aet.artemis.communication.domain.push_notification.PushNotificationApiType;
import de.tum.cit.aet.artemis.communication.domain.push_notification.PushNotificationDeviceConfiguration;
import de.tum.cit.aet.artemis.communication.domain.push_notification.PushNotificationDeviceType;
import de.tum.cit.aet.artemis.communication.repository.PushNotificationDeviceConfigurationRepository;
import de.tum.cit.aet.artemis.communication.service.CourseNotificationPushProxyService;
import de.tum.cit.aet.artemis.communication.service.notifications.push_notifications.ApplePushNotificationService;
import de.tum.cit.aet.artemis.communication.service.notifications.push_notifications.FirebasePushNotificationService;
import de.tum.cit.aet.artemis.core.domain.User;

class AppleFirebasePushNotificationServiceTest {

    @Mock
    private PushNotificationDeviceConfigurationRepository repositoryMock;

    @Mock
    private RestTemplate appleRestTemplateMock;

    @Mock
    private RestTemplate firebaseRestTemplateMock;

    private ApplePushNotificationService applePushNotificationService;

    private FirebasePushNotificationService firebasePushNotificationService;

    @Mock
    private CourseNotificationPushProxyService courseNotificationPushProxyService;

    private Notification notification;

    private User student;

    private AutoCloseable closeable;

    @BeforeEach
    void setUp() {
        closeable = MockitoAnnotations.openMocks(this);

        student = new User();
        student.setId(1L);
        student.setLogin("1");

        notification = new GroupNotification(null, NotificationConstants.NEW_ANNOUNCEMENT_POST_TITLE, NotificationConstants.NEW_ANNOUNCEMENT_POST_TEXT, false, new String[0],
                student, GroupNotificationType.STUDENT);

        String token = "test";
        byte[] payload = HexFormat.of().parseHex("e04fd020ea3a6910a2d808002b30309d");
        PushNotificationDeviceConfiguration applePushNotificationDeviceConfiguration = new PushNotificationDeviceConfiguration(token, PushNotificationDeviceType.APNS, new Date(),
                payload, student, PushNotificationApiType.IOS_V2, "1.0.0");
        PushNotificationDeviceConfiguration firebasePushNotificationDeviceConfiguration = new PushNotificationDeviceConfiguration(token, PushNotificationDeviceType.FIREBASE,
                new Date(), payload, student, PushNotificationApiType.DEFAULT, "1.0.0");

        when(repositoryMock.findByUserIn(anySet(), eq(PushNotificationDeviceType.APNS))).thenReturn(Collections.singletonList(applePushNotificationDeviceConfiguration));
        when(repositoryMock.findByUserIn(anySet(), eq(PushNotificationDeviceType.FIREBASE))).thenReturn(Collections.singletonList(firebasePushNotificationDeviceConfiguration));

        applePushNotificationService = new ApplePushNotificationService(courseNotificationPushProxyService, repositoryMock, appleRestTemplateMock);
        firebasePushNotificationService = new FirebasePushNotificationService(courseNotificationPushProxyService, repositoryMock, firebaseRestTemplateMock);

        ReflectionTestUtils.setField(applePushNotificationService, "relayServerBaseUrl", "test");
        ReflectionTestUtils.setField(firebasePushNotificationService, "relayServerBaseUrl", "test");
    }

    @AfterEach
    void tearDown() throws Exception {
        if (closeable != null) {
            closeable.close();
        }
    }

    @Test
    void sendNotificationRequestsToEndpoint_shouldSendNotifications() throws InterruptedException {
        // Given
        when(appleRestTemplateMock.postForObject(any(String.class), any(HttpEntity.class), eq(String.class))).thenReturn("ok");
        when(firebaseRestTemplateMock.postForObject(any(String.class), any(HttpEntity.class), eq(String.class))).thenReturn("ok");

        // When
        applePushNotificationService.sendNotification(notification, student, null);
        firebasePushNotificationService.sendNotification(notification, student, null);

        // Then
        verify(appleRestTemplateMock, timeout(1000)).postForObject(anyString(), any(HttpEntity.class), eq(String.class));
        verify(firebaseRestTemplateMock, timeout(1000)).postForObject(anyString(), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void scheduleSendBatch_shouldRetryOnRestClientException() throws InterruptedException {
        when(appleRestTemplateMock.postForObject(anyString(), any(HttpEntity.class), any())).thenThrow(new RestClientException(""));
        when(firebaseRestTemplateMock.postForObject(anyString(), any(HttpEntity.class), any())).thenThrow(new RestClientException(""));

        // When
        applePushNotificationService.sendNotification(notification, student, null);
        firebasePushNotificationService.sendNotification(notification, student, null);

        // Then
        verify(appleRestTemplateMock, timeout(5000).atLeast(2)).postForObject(anyString(), any(HttpEntity.class), any());
        verify(firebaseRestTemplateMock, timeout(5000).atLeast(2)).postForObject(anyString(), any(HttpEntity.class), any());
    }

    @Test
    void getDeviceType_shouldReturnAPNS() {
        // When
        PushNotificationDeviceType deviceType = applePushNotificationService.getDeviceType();

        // Then
        assertThat(deviceType).isEqualTo(PushNotificationDeviceType.APNS);
    }

    @Test
    void getRepository_shouldReturnRepository() {
        // When
        PushNotificationDeviceConfigurationRepository repository = applePushNotificationService.getRepository();

        // Then
        assertThat(repository).isEqualTo(repositoryMock);
    }

    @Test
    void getDeviceType_shouldReturnFirebase() {
        // When
        PushNotificationDeviceType deviceType = firebasePushNotificationService.getDeviceType();

        // Then
        assertThat(deviceType).isEqualTo(PushNotificationDeviceType.FIREBASE);
    }
}
