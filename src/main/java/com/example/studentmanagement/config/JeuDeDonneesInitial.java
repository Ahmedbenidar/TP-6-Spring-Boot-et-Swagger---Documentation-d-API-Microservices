package com.example.studentmanagement.config;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.studentmanagement.domain.Student;
import com.example.studentmanagement.repository.StudentRepository;

/**
 * Alimente la base au premier demarrage pour que les tests REST et Swagger
 * disposent d'un jeu de donnees coherent.
 */
@Configuration
public class JeuDeDonneesInitial {

    private static final Logger JOURNAL = LoggerFactory.getLogger(JeuDeDonneesInitial.class);

    @Bean
    public CommandLineRunner chargerEtudiantsDeDemonstration(StudentRepository studentRepository) {
        return args -> {
            if (studentRepository.count() > 0) {
                JOURNAL.info("Base deja alimentee : {} etudiants, aucun ajout.", studentRepository.count());
                return;
            }

            studentRepository.save(new Student("BEN IDAR", "Ahmed", LocalDate.of(2001, 3, 14),
                    "ahmed.benidar@toubkalit.ma", "Genie Informatique"));
            studentRepository.save(new Student("EL FASSI", "Salma", LocalDate.of(2000, 7, 22),
                    "salma.elfassi@toubkalit.ma", "Genie Informatique"));
            studentRepository.save(new Student("OUBAHA", "Yassine", LocalDate.of(1999, 11, 5),
                    "yassine.oubaha@toubkalit.ma", "Genie Civil"));
            studentRepository.save(new Student("NDAHBI", "Khadija", LocalDate.of(2002, 1, 30),
                    "khadija.ndahbi@toubkalit.ma", "Genie Industriel"));
            studentRepository.save(new Student("BOUZID", "Hamza", LocalDate.of(1998, 9, 18),
                    "hamza.bouzid@toubkalit.ma", "Genie Mecanique"));
            studentRepository.save(new Student("AMRAOUI", "Nadia", LocalDate.of(2001, 6, 2),
                    "nadia.amraoui@toubkalit.ma", "Genie Civil"));
            studentRepository.save(new Student("TAZI", "Mehdi", LocalDate.of(2003, 4, 27),
                    "mehdi.tazi@toubkalit.ma", "Genie Informatique"));
            studentRepository.save(new Student("CHAKIR", "Souad", LocalDate.of(2000, 12, 9),
                    "souad.chakir@toubkalit.ma", "Genie Industriel"));

            JOURNAL.info("Jeu de donnees initial charge : {} etudiants.", studentRepository.count());
        };
    }
}
