package com.example.studentmanagement.service;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import com.example.studentmanagement.domain.Student;

/**
 * Contrat metier de la gestion des etudiants.
 * Le controleur REST ne depend que de cette interface.
 */
public interface StudentService {

    List<Student> findAll();

    Student save(Student student);

    boolean delete(int id);

    long countStudents();

    Collection<Object[]> findNbrStudentByYear();

    Student findById(int id);

    List<Student> rechercherParNom(String nom);

    Map<String, Object> statistiques();
}
