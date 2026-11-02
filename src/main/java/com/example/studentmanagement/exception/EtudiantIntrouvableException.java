package com.example.studentmanagement.exception;

/**
 * Levee lorsqu'un etudiant demande n'existe pas dans la base.
 */
public class EtudiantIntrouvableException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final transient Integer identifiant;

    public EtudiantIntrouvableException(Integer identifiant) {
        super("Aucun etudiant ne correspond a l'identifiant " + identifiant);
        this.identifiant = identifiant;
    }

    public Integer getIdentifiant() {
        return identifiant;
    }
}
