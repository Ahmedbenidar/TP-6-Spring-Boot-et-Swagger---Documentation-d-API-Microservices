package com.example.studentmanagement.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.example.studentmanagement.domain.Student;
import com.example.studentmanagement.exception.EtudiantIntrouvableException;
import com.example.studentmanagement.service.StudentService;

/**
 * Tests unitaires du controleur REST.
 * Le service est simule par Mockito : aucun acces a MySQL n'est necessaire.
 */
@ExtendWith(MockitoExtension.class)
class StudentControllerTest {

    @Mock
    private StudentService studentService;

    @InjectMocks
    private StudentController studentController;

    private Student etudiant(int id, String nom, String prenom, int annee) {
        Student student = new Student();
        student.setId(id);
        student.setNom(nom);
        student.setPrenom(prenom);
        student.setDateNaissance(LocalDate.of(annee, 3, 14));
        student.setEmail(nom.toLowerCase() + "@toubkalit.ma");
        student.setFiliere("Genie Informatique");
        return student;
    }

    @Test
    @DisplayName("POST /students/save renvoie 201 et l'etudiant enregistre")
    void enregistrerUnEtudiantRenvoie201() {
        Student aEnregistrer = etudiant(0, "BEN IDAR", "Ahmed", 2001);
        Student enregistre = etudiant(1, "BEN IDAR", "Ahmed", 2001);
        when(studentService.save(any(Student.class))).thenReturn(enregistre);

        ResponseEntity<Student> reponse = studentController.save(aEnregistrer);

        assertEquals(HttpStatus.CREATED, reponse.getStatusCode());
        assertNotNull(reponse.getBody());
        assertEquals(1, reponse.getBody().getId());
        assertEquals("BEN IDAR", reponse.getBody().getNom());
        assertEquals("/students/1", reponse.getHeaders().getLocation().getPath());
        verify(studentService).save(aEnregistrer);
    }

    @Test
    @DisplayName("GET /students/all renvoie 200 et la liste complete")
    void listerTousLesEtudiantsRenvoie200() {
        when(studentService.findAll()).thenReturn(Arrays.asList(
                etudiant(1, "BEN IDAR", "Ahmed", 2001),
                etudiant(2, "EL FASSI", "Salma", 2000),
                etudiant(3, "OUBAHA", "Yassine", 1999)));

        ResponseEntity<List<Student>> reponse = studentController.findAll();

        assertEquals(HttpStatus.OK, reponse.getStatusCode());
        assertEquals(3, reponse.getBody().size());
    }

    @Test
    @DisplayName("GET /students/count renvoie le nombre total d'etudiants")
    void compterLesEtudiantsRenvoie200() {
        when(studentService.countStudents()).thenReturn(8L);

        ResponseEntity<Long> reponse = studentController.countStudent();

        assertEquals(HttpStatus.OK, reponse.getStatusCode());
        assertEquals(8L, reponse.getBody());
    }

    @Test
    @DisplayName("GET /students/byYear renvoie la repartition par annee")
    void repartitionParAnneeRenvoie200() {
        when(studentService.findNbrStudentByYear()).thenReturn(Arrays.asList(
                new Object[] {2000, 2L},
                new Object[] {2001, 3L}));

        ResponseEntity<Collection<?>> reponse = studentController.findByYear();

        assertEquals(HttpStatus.OK, reponse.getStatusCode());
        assertEquals(2, reponse.getBody().size());
    }

    @Test
    @DisplayName("DELETE /students/delete/{id} renvoie 204 quand l'etudiant existe")
    void supprimerUnEtudiantExistantRenvoie204() {
        when(studentService.delete(1)).thenReturn(true);

        ResponseEntity<Void> reponse = studentController.delete(1);

        assertEquals(HttpStatus.NO_CONTENT, reponse.getStatusCode());
        verify(studentService).delete(1);
    }

    @Test
    @DisplayName("DELETE /students/delete/{id} renvoie 404 quand l'etudiant est absent")
    void supprimerUnEtudiantInexistantRenvoie404() {
        when(studentService.delete(999)).thenReturn(false);

        ResponseEntity<Void> reponse = studentController.delete(999);

        assertEquals(HttpStatus.NOT_FOUND, reponse.getStatusCode());
    }

    @Test
    @DisplayName("GET /students/{id} renvoie 200 quand l'etudiant existe")
    void consulterUnEtudiantRenvoie200() {
        when(studentService.findById(2)).thenReturn(etudiant(2, "EL FASSI", "Salma", 2000));

        ResponseEntity<Student> reponse = studentController.findById(2);

        assertEquals(HttpStatus.OK, reponse.getStatusCode());
        assertEquals("EL FASSI", reponse.getBody().getNom());
    }

    @Test
    @DisplayName("GET /students/{id} propage l'exception 404 du service")
    void consulterUnEtudiantAbsentLeveUneException() {
        when(studentService.findById(42)).thenThrow(new EtudiantIntrouvableException(42));

        try {
            studentController.findById(42);
        } catch (EtudiantIntrouvableException attendu) {
            assertEquals(42, attendu.getIdentifiant());
            return;
        }
        throw new AssertionError("Une EtudiantIntrouvableException etait attendue");
    }

    @Test
    @DisplayName("GET /students/search filtre sur le nom")
    void rechercherParNomRenvoie200() {
        when(studentService.rechercherParNom("BEN"))
                .thenReturn(Collections.singletonList(etudiant(1, "BEN IDAR", "Ahmed", 2001)));

        ResponseEntity<List<Student>> reponse = studentController.rechercher("BEN");

        assertEquals(HttpStatus.OK, reponse.getStatusCode());
        assertEquals(1, reponse.getBody().size());
        assertEquals("BEN IDAR", reponse.getBody().get(0).getNom());
    }
}
