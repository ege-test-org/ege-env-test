package de.tum.cit.aet.artemis.lecture;

import static de.tum.cit.aet.artemis.core.config.Constants.ARTEMIS_FILE_PATH_PREFIX;
import static org.apache.velocity.shaded.commons.io.FilenameUtils.getExtension;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.util.LinkedMultiValueMap;

import de.tum.cit.aet.artemis.core.domain.Course;
import de.tum.cit.aet.artemis.lecture.domain.Attachment;
import de.tum.cit.aet.artemis.lecture.domain.Lecture;
import de.tum.cit.aet.artemis.lecture.repository.AttachmentRepository;
import de.tum.cit.aet.artemis.lecture.repository.LectureRepository;
import de.tum.cit.aet.artemis.lecture.util.LectureFactory;
import de.tum.cit.aet.artemis.shared.base.AbstractSpringIntegrationIndependentTest;
import de.tum.cit.aet.artemis.text.domain.TextExercise;
import de.tum.cit.aet.artemis.text.util.TextExerciseUtilService;

class AttachmentResourceIntegrationTest extends AbstractSpringIntegrationIndependentTest {

    private static final String TEST_PREFIX = "attachmentresourceintegrationtest";

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Autowired
    private LectureRepository lectureRepository;

    @Autowired
    private TextExerciseUtilService textExerciseUtilService;

    private Attachment attachment;

    private Lecture lecture;

    private TextExercise textExercise;

    @BeforeEach
    void initTestCase() {
        userUtilService.addUsers(TEST_PREFIX, 0, 1, 0, 1);

        attachment = LectureFactory.generateAttachment(null);
        attachment.setLink("temp/example.txt");

        var course = textExerciseUtilService.addCourseWithOneReleasedTextExercise();
        textExercise = exerciseUtilService.getFirstExerciseWithType(course, TextExercise.class);
        lecture = new Lecture();
        lecture.setTitle("test");
        lecture.setDescription("test");
        lecture.setCourse(course);
        lecture = lectureRepository.save(lecture);
        attachment.setLecture(lecture);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void createAttachment() throws Exception {
        Attachment actualAttachment = request.postWithMultipartFile("/api/lecture/attachments", attachment, "attachment",
                new MockMultipartFile("file", "test.txt", MediaType.TEXT_PLAIN_VALUE, "testContent".getBytes()), Attachment.class, HttpStatus.CREATED);
        String actualLink = actualAttachment.getLink();
        assertThat(actualLink).isNotNull();
        // getLectureAttachment uses the provided file name to fetch the attachment which has that attachment name (not filename)
        String linkWithCorrectFileName = actualLink.substring(0, actualLink.lastIndexOf('/') + 1) + attachment.getName() + "." + getExtension(actualAttachment.getLink());
        String requestUrl = String.format("%s%s", ARTEMIS_FILE_PATH_PREFIX, linkWithCorrectFileName);
        MvcResult file = request.performMvcRequest(get(requestUrl)).andExpect(status().isOk()).andExpect(content().contentType(MediaType.TEXT_PLAIN_VALUE)).andReturn();
        assertThat(file.getResponse().getContentAsByteArray()).isNotEmpty();
        var expectedAttachment = attachmentRepository.findById(actualAttachment.getId()).orElseThrow();
        assertThat(actualAttachment).isEqualTo(expectedAttachment);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void createAttachment_noFile() throws Exception {
        request.postWithMultipartFile("/api/lecture/attachments", attachment, "attachment", null, Attachment.class, HttpStatus.BAD_REQUEST);
    }

    @ParameterizedTest
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    @ValueSource(booleans = { true, false })
    void updateAttachment(boolean fileUpdate) throws Exception {
        attachment = attachmentRepository.save(attachment);
        attachment.setName("new name");
        var params = new LinkedMultiValueMap<String, String>();
        var notificationText = "notified!";
        params.add("notificationText", notificationText);
        MockMultipartFile file = fileUpdate ? new MockMultipartFile("file", "test.txt", MediaType.TEXT_PLAIN_VALUE, "testContent".getBytes()) : null;

        var actualAttachment = request.putWithMultipartFile("/api/lecture/attachments/" + attachment.getId(), attachment, "attachment", file, Attachment.class, HttpStatus.OK,
                params);
        var expectedAttachment = attachmentRepository.findById(actualAttachment.getId()).orElseThrow();

        assertThat(actualAttachment.getName()).isEqualTo("new name");
        var ignoringFields = new String[] { "name", "fileService", "filePathService", "entityFileService", "prevLink", "lecture.lectureUnits", "lecture.posts", "lecture.course",
                "lecture.attachments" };
        assertThat(actualAttachment).usingRecursiveComparison().ignoringFields(ignoringFields).isEqualTo(expectedAttachment);
        verify(groupNotificationService).notifyStudentGroupAboutAttachmentChange(actualAttachment, notificationText);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void getAttachment() throws Exception {
        attachment = attachmentRepository.save(attachment);
        attachment.setName("new name");
        var actualAttachment = request.get("/api/lecture/attachments/" + attachment.getId(), HttpStatus.OK, Attachment.class);
        assertThat(actualAttachment).isEqualTo(attachment);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "tutor1", roles = "TA")
    void getAttachmentsForLecture() throws Exception {
        attachment = attachmentRepository.save(attachment);
        var actualAttachments = request.getList("/api/lecture/lectures/" + lecture.getId() + "/attachments", HttpStatus.OK, Attachment.class);
        assertThat(actualAttachments).hasSize(1);
        assertThat(actualAttachments.stream().findFirst()).contains(attachment);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void deleteAttachment() throws Exception {
        attachment = attachmentRepository.save(attachment);
        request.delete("/api/lecture/attachments/" + attachment.getId(), HttpStatus.OK);
        assertThat(attachmentRepository.findById(attachment.getId())).isEmpty();
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void deleteAttachment_connectedToExercise() throws Exception {
        attachment.setLecture(null);
        attachment.setExercise(textExercise);
        attachment = attachmentRepository.save(attachment);
        request.delete("/api/lecture/attachments/" + attachment.getId(), HttpStatus.OK);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void deleteAttachment_noAttachment() throws Exception {
        request.delete("/api/lecture/attachments/-1", HttpStatus.NOT_FOUND);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void deleteAttachment_noCourse() throws Exception {
        attachment = attachmentRepository.save(attachment);
        lecture.setCourse(null);
        lectureRepository.save(lecture);
        request.delete("/api/lecture/attachments/" + attachment.getId(), HttpStatus.BAD_REQUEST);
    }

    @Test
    @WithMockUser(username = TEST_PREFIX + "instructor1", roles = "INSTRUCTOR")
    void deleteAttachment_notInstructorInACourse() throws Exception {
        var course = courseRepository.save(new Course());
        attachment = attachmentRepository.save(attachment);
        lecture.setCourse(course);
        lectureRepository.save(lecture);
        request.delete("/api/lecture/attachments/" + attachment.getId(), HttpStatus.FORBIDDEN);
    }
}
