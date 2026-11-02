package com.example.studentmanagement.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.studentmanagement.domain.Student;

/**
 * Acces aux donnees des etudiants.
 * Spring Data JPA fournit l'implementation des methodes CRUD a l'execution.
 */
@Repository
public interface StudentRepository extends JpaRepository<Student, Integer> {

    /** Recherche d'un etudiant par son identifiant (methode declaree dans l'enonce). */
    Student findById(int id);

    /**
     * Nombre d'etudiants par annee de naissance.
     *
     * @return une collection de couples [annee, nombre d'etudiants]
     */
    @Query("SELECT YEAR(s.dateNaissance), COUNT(s) FROM Student s GROUP BY YEAR(s.dateNaissance) ORDER BY YEAR(s.dateNaissance)")
    Collection<Object[]> findNbrStudentByYear();

    /** Recherche partielle sur le nom, insensible a la casse. */
    List<Student> findByNomContainingIgnoreCaseOrderByNomAsc(String nom);

    /** Nombre d'etudiants d'une filiere donnee. */
    long countByFiliereIgnoreCase(@Param("filiere") String filiere);

    /** Nombre d'etudiants nes une annee precise (utilise par les statistiques). */
    @Query("SELECT COUNT(s) FROM Student s WHERE YEAR(s.dateNaissance) = :annee")
    long countByAnneeNaissance(@Param("annee") int annee);
}
