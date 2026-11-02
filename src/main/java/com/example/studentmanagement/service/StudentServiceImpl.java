package com.example.studentmanagement.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.studentmanagement.domain.Student;
import com.example.studentmanagement.exception.EtudiantIntrouvableException;
import com.example.studentmanagement.repository.StudentRepository;

/**
 * Implementation de la logique metier.
 * Les transactions en lecture seule evitent de verrouiller inutilement les lignes.
 */
@Service
@Transactional(readOnly = true)
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;

    public StudentServiceImpl(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    @Override
    public List<Student> findAll() {
        return studentRepository.findAll();
    }

    @Override
    @Transactional
    public Student save(Student student) {
        if (student.getId() != null) {
            // mise a jour : l'etudiant doit exister
            findById(student.getId());
        }
        return studentRepository.save(student);
    }

    @Override
    @Transactional
    public boolean delete(int id) {
        if (!studentRepository.existsById(id)) {
            return false;
        }
        studentRepository.deleteById(id);
        return true;
    }

    @Override
    public long countStudents() {
        return studentRepository.count();
    }

    @Override
    public Collection<Object[]> findNbrStudentByYear() {
        return studentRepository.findNbrStudentByYear();
    }

    @Override
    public Student findById(int id) {
        Student etudiant = studentRepository.findById(id);
        if (etudiant == null) {
            throw new EtudiantIntrouvableException(id);
        }
        return etudiant;
    }

    @Override
    public List<Student> rechercherParNom(String nom) {
        if (nom == null || nom.trim().isEmpty()) {
            return findAll();
        }
        return studentRepository.findByNomContainingIgnoreCaseOrderByNomAsc(nom.trim());
    }

    @Override
    public Map<String, Object> statistiques() {
        List<Student> etudiants = findAll();

        Set<String> filieres = new LinkedHashSet<>();
        for (Student etudiant : etudiants) {
            filieres.add(etudiant.getFiliere());
        }

        Map<String, Long> repartitionFilieres = new LinkedHashMap<>();
        for (String filiere : filieres) {
            repartitionFilieres.put(filiere, studentRepository.countByFiliereIgnoreCase(filiere));
        }

        List<Map<String, Object>> repartitionAnnees = new ArrayList<>();
        for (Object[] ligne : findNbrStudentByYear()) {
            Map<String, Object> element = new LinkedHashMap<>();
            element.put("annee", ligne[0]);
            element.put("nombreEtudiants", ligne[1]);
            repartitionAnnees.add(element);
        }

        Map<String, Object> synthese = new LinkedHashMap<>();
        synthese.put("totalEtudiants", etudiants.size());
        synthese.put("nombreFilieres", filieres.size());
        synthese.put("repartitionParFiliere", repartitionFilieres);
        synthese.put("repartitionParAnneeNaissance", repartitionAnnees);
        return synthese;
    }
}
