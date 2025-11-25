package com.agentic.agentic_backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.neo4j.driver.Session;
import org.neo4j.driver.Driver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DataInitializer implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);
    @Autowired
    private Driver driver;

    @Override
    public void run(String... args) throws Exception {
        try {
            logger.info("Starting Neo4j ontology initialization...");
            try (Session session = driver.session()) {
                // Delete all existing nodes first
                session.run("MATCH (n) DETACH DELETE n");
                logger.info("✓ Deleted all existing nodes from Neo4j database");

                // Create 8 core entities
                session.run(
                        "CREATE (d:Doctor {doctorId:'doc1', name:'Dr. Jane Smith', specialty:'General Physician', contactNumber:'1234567890', qualifications:'MBBS, MD', email:'jane.smith@example.com'})");
                logger.info("✓ Created Doctor node");
                session.run(
                        "CREATE (h:Hospital {hospitalId:'hosp1', name:'City General Hospital', location:'Colombo', contactNumber:'011-1234567', type:'General'})");
                logger.info("✓ Created Hospital node");
                session.run(
                        "CREATE (di:Diagnosis {diagnosisId:'diag1', name:'Hypertension', description:'High blood pressure', diagnosedDate:'2024-01-15'})");
                logger.info("✓ Created Diagnosis node");
                session.run(
                        "CREATE (t:Treatment {treatmentId:'treat1', name:'Hypertension Management', startDate:'2024-01-21', endDate:'2024-06-21', status:'Ongoing'})");
                logger.info("✓ Created Treatment node");
                session.run(
                        "CREATE (m:Medication {medicationId:'med1', drugName:'Lisinopril', dosage:'10mg', frequency:'Once daily', prescribedDate:'2024-01-20', adherence:'Compliant'})");
                logger.info("✓ Created Medication node");
                session.run(
                        "CREATE (a:Appointment {appointmentId:'appt1', date:'2024-01-20', type:'Consultation', status:'Completed'})");
                logger.info("✓ Created Appointment node");
                session.run(
                        "CREATE (te:Test {testId:'test1', name:'Blood Pressure Test', result:'140/90', date:'2024-01-20', status:'Completed'})");
                logger.info("✓ Created Test node");
                session.run(
                        "CREATE (al:Alert {alertId:'alert1', message:'Patient missed medication dose', type:'MissedMedication', timestamp:'2024-01-22T09:00:00Z', resolved:false})");
                logger.info("✓ Created Alert node");

                // Create 9th entity - Patient
                session.run(
                        "CREATE (p:Patient {patientId:'pat1', name:'John Doe', dob:'1980-05-10', gender:'Male', contactNumber:'077-1234567', address:'123 Main St, Colombo', bloodGroup:'A+', insuranceProvider:'Ceylinco', currentStatus:'Active'})");
                logger.info("✓ Created Patient node");

                // Create relationships
                session.run(
                        "MATCH (d:Doctor {doctorId:'doc1'}), (h:Hospital {hospitalId:'hosp1'}) CREATE (d)-[:PRACTICES_AT {startDate:'2024-01-01'}]->(h)");
                session.run(
                        "MATCH (d:Doctor {doctorId:'doc1'}), (t:Treatment {treatmentId:'treat1'}) CREATE (d)-[:PERFORMED {performedDate:'2024-01-21'}]->(t)");
                session.run(
                        "MATCH (d:Doctor {doctorId:'doc1'}), (te:Test {testId:'test1'}) CREATE (d)-[:ORDERED {orderedDate:'2024-01-20'}]->(te)");
                session.run(
                        "MATCH (d:Doctor {doctorId:'doc1'}), (m:Medication {medicationId:'med1'}) CREATE (d)-[:PRESCRIBED {prescribedDate:'2024-01-20'}]->(m)");
                session.run(
                        "MATCH (d:Doctor {doctorId:'doc1'}), (p:Patient {patientId:'pat1'}) CREATE (d)-[:CONSULTED {consultationDate:'2024-01-20'}]->(p)");
                session.run(
                        "MATCH (p:Patient {patientId:'pat1'}), (di:Diagnosis {diagnosisId:'diag1'}) CREATE (p)-[:HAS_DIAGNOSIS {diagnosedDate:'2024-01-15'}]->(di)");
                session.run(
                        "MATCH (p:Patient {patientId:'pat1'}), (t:Treatment {treatmentId:'treat1'}) CREATE (p)-[:RECEIVES_TREATMENT {startDate:'2024-01-21', endDate:'2024-06-21'}]->(t)");
                session.run(
                        "MATCH (p:Patient {patientId:'pat1'}), (m:Medication {medicationId:'med1'}) CREATE (p)-[:TAKES_MEDICATION {prescribedDate:'2024-01-20', adherence:'Compliant'}]->(m)");
                session.run(
                        "MATCH (p:Patient {patientId:'pat1'}), (a:Appointment {appointmentId:'appt1'}) CREATE (p)-[:HAS_APPOINTMENT {appointmentDate:'2024-01-20', appointmentType:'Consultation', status:'Completed'}]->(a)");
                session.run(
                        "MATCH (p:Patient {patientId:'pat1'}), (te:Test {testId:'test1'}) CREATE (p)-[:UNDERWENT_TEST {performedDate:'2024-01-20'}]->(te)");
                session.run(
                        "MATCH (p:Patient {patientId:'pat1'}), (h:Hospital {hospitalId:'hosp1'}) CREATE (p)-[:ADMITTED_TO {admissionDate:'2024-01-19', dischargeDate:'2024-01-21'}]->(h)");
                session.run(
                        "MATCH (p:Patient {patientId:'pat1'}), (d:Doctor {doctorId:'doc1'}) CREATE (p)-[:CARED_FOR_BY {startDate:'2024-01-15'}]->(d)");
                session.run(
                        "MATCH (te:Test {testId:'test1'}), (di:Diagnosis {diagnosisId:'diag1'}) CREATE (te)-[:RESULTED_IN {resultImpact:'Confirmed hypertension'}]->(di)");
                session.run(
                        "MATCH (di:Diagnosis {diagnosisId:'diag1'}), (t:Treatment {treatmentId:'treat1'}) CREATE (di)-[:LEADS_TO]->(t)");
                session.run(
                        "MATCH (a:Appointment {appointmentId:'appt1'}), (t:Treatment {treatmentId:'treat1'}) CREATE (a)-[:FOLLOWS_UP]->(t)");
                session.run(
                        "MATCH (al:Alert {alertId:'alert1'}), (p:Patient {patientId:'pat1'}) CREATE (al)-[:FOR_PATIENT]->(p)");
                session.run(
                        "MATCH (al:Alert {alertId:'alert1'}), (d:Doctor {doctorId:'doc1'}) CREATE (al)-[:FOR_DOCTOR]->(d)");
                session.run(
                        "MATCH (m:Medication {medicationId:'med1'}), (di:Diagnosis {diagnosisId:'diag1'}) CREATE (m)-[:FOR_DIAGNOSIS]->(di)");
                session.run(
                        "MATCH (a:Appointment {appointmentId:'appt1'}), (d:Doctor {doctorId:'doc1'}) CREATE (a)-[:WITH_DOCTOR]->(d)");
                session.run(
                        "MATCH (a:Appointment {appointmentId:'appt1'}), (h:Hospital {hospitalId:'hosp1'}) CREATE (a)-[:AT_HOSPITAL]->(h)");

                logger.info("✓ Ontology initialization complete: All 9 entities and relationships created in Neo4j!");
            }
        } catch (Exception e) {
            logger.warn("Could not initialize Neo4j ontology at startup (data may already exist or connection unavailable). Application will continue.", e.getMessage());
            logger.debug("Full exception: ", e);
            // Don't throw the exception - allow the application to start anyway
        }
    }
}
