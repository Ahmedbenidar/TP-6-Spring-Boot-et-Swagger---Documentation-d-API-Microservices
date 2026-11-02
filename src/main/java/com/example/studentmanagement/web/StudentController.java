package com.example.studentmanagement.web;

import java.net.URI;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.studentmanagement.domain.Student;
import com.example.studentmanagement.service.StudentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

/**
 * Endpoints REST de gestion des etudiants.
 * Le controleur se contente de traduire HTTP <-> metier : aucune logique de persistance ici.
 */
@RestController
@RequestMapping("/students")
@Tag(name = "Etudiants", description = "Creation, consultation, suppression et statistiques des etudiants")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @Operation(summary = "Enregistrer un etudiant",
            description = "Cree un etudiant et renvoie la ressource creee avec son identifiant genere.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Etudiant enregistre"),
            @ApiResponse(responseCode = "400", description = "Donnees invalides")
    })
    @PostMapping("/save")
    public ResponseEntity<Student> save(@Valid @RequestBody Student student) {
        Student enregistre = studentService.save(student);
        return ResponseEntity
                .created(URI.create("/students/" + enregistre.getId()))
                .body(enregistre);
    }

    @Operation(summary = "Lister tous les etudiants")
    @ApiResponse(responseCode = "200", description = "Liste complete renvoyee")
    @GetMapping("/all")
    public ResponseEntity<List<Student>> findAll() {
        return new ResponseEntity<>(studentService.findAll(), HttpStatus.OK);
    }

    @Operation(summary = "Consulter un etudiant par son identifiant")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Etudiant trouve"),
            @ApiResponse(responseCode = "404", description = "Aucun etudiant pour cet identifiant")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Student> findById(
            @Parameter(description = "Identifiant de l'etudiant", example = "1") @PathVariable("id") int id) {
        return new ResponseEntity<>(studentService.findById(id), HttpStatus.OK);
    }

    @Operation(summary = "Supprimer un etudiant")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Etudiant supprime"),
            @ApiResponse(responseCode = "404", description = "Etudiant inexistant")
    })
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "Identifiant de l'etudiant", example = "1") @PathVariable("id") int id) {
        if (studentService.delete(id)) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @Operation(summary = "Compter les etudiants")
    @ApiResponse(responseCode = "200", description = "Nombre total d'etudiants")
    @GetMapping("/count")
    public ResponseEntity<Long> countStudent() {
        return new ResponseEntity<>(studentService.countStudents(), HttpStatus.OK);
    }

    @Operation(summary = "Repartition des etudiants par annee de naissance",
            description = "Renvoie des couples [annee, nombre d'etudiants] calcules par une requete JPQL.")
    @ApiResponse(responseCode = "200", description = "Repartition calculee")
    @GetMapping("/byYear")
    public ResponseEntity<Collection<?>> findByYear() {
        return new ResponseEntity<>(studentService.findNbrStudentByYear(), HttpStatus.OK);
    }

    @Operation(summary = "Rechercher des etudiants par nom")
    @ApiResponse(responseCode = "200", description = "Etudiants dont le nom contient le filtre")
    @GetMapping("/search")
    public ResponseEntity<List<Student>> rechercher(
            @Parameter(description = "Fragment de nom recherche", example = "BEN")
            @RequestParam(name = "nom", required = false, defaultValue = "") String nom) {
        return new ResponseEntity<>(studentService.rechercherParNom(nom), HttpStatus.OK);
    }

    @Operation(summary = "Statistiques agregees de la promotion")
    @ApiResponse(responseCode = "200", description = "Total, filieres et repartition par annee")
    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> statistiques() {
        return new ResponseEntity<>(studentService.statistiques(), HttpStatus.OK);
    }
}
