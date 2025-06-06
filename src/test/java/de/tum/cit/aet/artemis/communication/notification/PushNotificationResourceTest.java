package de.tum.cit.aet.artemis.communication.notification;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.test.context.support.WithMockUser;

import de.tum.cit.aet.artemis.communication.domain.push_notification.PushNotificationApiType;
import de.tum.cit.aet.artemis.communication.domain.push_notification.PushNotificationDeviceConfiguration;
import de.tum.cit.aet.artemis.communication.domain.push_notification.PushNotificationDeviceType;
import de.tum.cit.aet.artemis.communication.dto.PushNotificationRegisterBody;
import de.tum.cit.aet.artemis.communication.dto.PushNotificationRegisterDTO;
import de.tum.cit.aet.artemis.communication.dto.PushNotificationUnregisterRequest;
import de.tum.cit.aet.artemis.communication.repository.PushNotificationDeviceConfigurationRepository;
import de.tum.cit.aet.artemis.core.domain.User;
import de.tum.cit.aet.artemis.core.test_repository.UserTestRepository;
import de.tum.cit.aet.artemis.core.user.util.UserUtilService;
import de.tum.cit.aet.artemis.shared.base.AbstractSpringIntegrationIndependentTest;

class PushNotificationResourceTest extends AbstractSpringIntegrationIndependentTest {

    @Autowired
    private UserTestRepository userRepository;

    @Autowired
    private PushNotificationDeviceConfigurationRepository pushNotificationDeviceConfigurationRepository;

    @Autowired
    private UserUtilService userUtilService;

    private static final String FAKE_TOKEN = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ4eDQ0eHh4IiwiYXV0aCI6IlJPTEVfVEEsUk9MRV9JTlNUUlVDVE9SLFJPTEVfVVNFUiIsImV4cCI6MjUzNDAyMjU3NjAwfQ.mm9sUblgWLp97xC5ML2z6KZ0rQucKOyP7zmmI_bINlfu_axQ1dmw7A60gzOH7kzArWtx7ZmHYQZN3RMwlKHRIA";

    private static final String USER_LOGIN = "test-user";

    private static final String FAKE_FIREBASE_TOKEN = "FakeFirebaseToken";

    private User user;

    @BeforeEach
    void setup() {
        user = userUtilService.createAndSaveUser(USER_LOGIN);
    }

    @AfterEach
    void teardown() {
        userRepository.delete(user);
        pushNotificationDeviceConfigurationRepository.deleteAll();
    }

    @Test
    @WithMockUser(username = USER_LOGIN, roles = "USER", password = FAKE_TOKEN)
    void shouldRegisterTokenWhenCredentialsAreValid() throws Exception {
        PushNotificationRegisterBody body = new PushNotificationRegisterBody(FAKE_FIREBASE_TOKEN, PushNotificationDeviceType.FIREBASE);
        PushNotificationRegisterDTO response = request.postWithResponseBody("/api/communication/push_notification/register", body, PushNotificationRegisterDTO.class);

        assertThat(response.secretKey()).isNotEmpty();
        List<PushNotificationDeviceConfiguration> deviceConfigurations = pushNotificationDeviceConfigurationRepository.findByUserIn(Set.of(user),
                PushNotificationDeviceType.FIREBASE);

        // TODO: why do the tests sometimes return 2 device configurations?
        assertThat(deviceConfigurations).hasSizeBetween(1, 2); // this avoids flaky tests, normally the size should be 1, but apparently some cleanup does not work
        PushNotificationDeviceConfiguration config = deviceConfigurations.getFirst();
        assertThat(config.getDeviceType()).isEqualTo(PushNotificationDeviceType.FIREBASE);
        assertThat(config.getExpirationDate()).isInTheFuture();
        assertThat(config.getVersionCode()).isNull();
    }

    @Test
    @WithMockUser(username = USER_LOGIN, roles = "USER", password = FAKE_TOKEN)
    void shouldRegisterVersionCodeWhenSupplied() throws Exception {
        PushNotificationRegisterBody body = new PushNotificationRegisterBody(FAKE_FIREBASE_TOKEN, PushNotificationDeviceType.FIREBASE, PushNotificationApiType.DEFAULT, "1.1.1");
        PushNotificationRegisterDTO response = request.postWithResponseBody("/api/communication/push_notification/register", body, PushNotificationRegisterDTO.class);

        assertThat(response.secretKey()).isNotEmpty();
        List<PushNotificationDeviceConfiguration> deviceConfigurations = pushNotificationDeviceConfigurationRepository.findByUserIn(Set.of(user),
                PushNotificationDeviceType.FIREBASE);

        // TODO: why do the tests sometimes return 2 device configurations?
        assertThat(deviceConfigurations).hasSizeBetween(1, 2); // this avoids flaky tests, normally the size should be 1, but apparently some cleanup does not work
        PushNotificationDeviceConfiguration config = deviceConfigurations.getFirst();
        assertThat(config.getDeviceType()).isEqualTo(PushNotificationDeviceType.FIREBASE);
        assertThat(config.getExpirationDate()).isInTheFuture();
        assertThat(config.getVersionCode()).isEqualTo("1.1.1");
    }

    @Test
    @WithMockUser(username = USER_LOGIN, roles = "USER", password = FAKE_TOKEN)
    void shouldNotRegisterWhenWrongFormatOfVersionCodeIsSupplied() throws Exception {
        PushNotificationRegisterBody body = new PushNotificationRegisterBody(FAKE_FIREBASE_TOKEN, PushNotificationDeviceType.FIREBASE, PushNotificationApiType.DEFAULT, "asdf");
        PushNotificationRegisterDTO response = request.postWithResponseBody("/api/push_notification/register", body, PushNotificationRegisterDTO.class);
        assertThat(response).isNull();
        List<PushNotificationDeviceConfiguration> deviceConfigurations = pushNotificationDeviceConfigurationRepository.findByUserIn(Set.of(user),
                PushNotificationDeviceType.FIREBASE);
        assertThat(deviceConfigurations).hasSize(0);
    }

    @Test
    @WithMockUser(username = USER_LOGIN, roles = "USER", password = FAKE_TOKEN)
    void shouldUnregisterWhenRequestingWithValidToken() throws Exception {
        shouldRegisterTokenWhenCredentialsAreValid();

        PushNotificationUnregisterRequest body = new PushNotificationUnregisterRequest(FAKE_FIREBASE_TOKEN, PushNotificationDeviceType.FIREBASE);
        request.delete("/api/communication/push_notification/unregister", HttpStatus.OK, body);

        List<PushNotificationDeviceConfiguration> deviceConfigurations = pushNotificationDeviceConfigurationRepository.findByUserIn(Set.of(user),
                PushNotificationDeviceType.FIREBASE);

        assertThat(deviceConfigurations).isEmpty();
    }

    @Test
    @WithMockUser(username = USER_LOGIN, roles = "USER")
    void testUnregisterNonExistentRegistration() throws Exception {
        PushNotificationUnregisterRequest body = new PushNotificationUnregisterRequest("Does not exist", PushNotificationDeviceType.FIREBASE);
        request.delete("/api/communication/push_notification/unregister", HttpStatus.NOT_FOUND, body);
    }
}
