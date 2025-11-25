import os
from typing import Dict, Any, List
from neo4j import GraphDatabase
import logging

logger = logging.getLogger(__name__)

class PatientJourneyLogic:
    def __init__(self):
        # Neo4j connection setup (use environment variables for security)
        try:
            uri = os.getenv("NEO4J_URI")
            user = os.getenv("NEO4J_USER")
            password = os.getenv("NEO4J_PASSWORD")
            
            logger.info(f"[DEBUG] Neo4j Configuration:")
            logger.info(f"[DEBUG] URI: {uri}")
            logger.info(f"[DEBUG] User: {user}")
            logger.info(f"[DEBUG] Password present: {bool(password)}")
            logger.info(f"Attempting Neo4j connection to: {uri}")
            print(f"[DEBUG] Neo4j URI: {uri}")
            print(f"[DEBUG] Neo4j User: {user}")
            print(f"[DEBUG] Neo4j Password present: {bool(password)}")
            
            if not all([uri, user, password]):
                missing = []
                if not uri: missing.append("NEO4J_URI")
                if not user: missing.append("NEO4J_USER")
                if not password: missing.append("NEO4J_PASSWORD")
                error_msg = f"Missing Neo4j credentials: {', '.join(missing)}"
                logger.error(error_msg)
                print(f"[ERROR] {error_msg}")
                print("[WARNING] Neo4j environment variables not set. Using mock data.")
                self.driver = None
                return
            
            # Create driver - bolt+s:// is secure scheme, use encrypted parameter
            self.driver = GraphDatabase.driver(
                uri, 
                auth=(user, password),
                encrypted=True,
                database=os.getenv("NEO4J_DATABASE", "neo4j")
            )
            logger.info("✓ Neo4j connection established successfully")
            print("[SUCCESS] Neo4j connection established")
                
        except Exception as e:
            logger.error(f"[ERROR] Failed to connect to Neo4j: {e}")
            print(f"[ERROR] Failed to connect to Neo4j: {e}")
            print("[WARNING] Neo4j connection failed. Using mock data for patient journey.")
            self.driver = None

    def get_patient_journey(self, patient_id: str) -> Dict[str, Any]:
        if not self.driver:
            # Return mock data for testing when Neo4j unavailable
            print(f"[DEBUG] Returning mock data for patient: {patient_id}")
            return {
                "patient_name": "John Doe" if patient_id == "pat1" else patient_id,
                "patient_id": patient_id,
                "journey_steps": [
                    "2024-01-15: Admitted to General Hospital with flu symptoms",
                    "2024-01-14: Had COVID-19 test - Result: Negative",
                    "2024-01-10: Diagnosed with Influenza A",
                    "2024-01-08: Appointment with Dr. Smith for routine checkup",
                    "2024-01-05: Prescribed Amoxicillin 500mg twice daily",
                    "2024-01-03: Started treatment for upper respiratory infection",
                    "2024-01-01: Had blood work done at Central Lab"
                ],
                "source": "mock_data"
            }
            
        with self.driver.session() as session:
            # First, get patient basic info
            patient_result = session.run(
                """
                MATCH (p:Patient)
                WHERE toLower(p.patientId) = toLower($patient_id) OR toLower(p.name) = toLower($patient_id)
                RETURN p.patientId as id, p.name as patient_name
                """,
                patient_id=patient_id
            )
            
            patient_record = patient_result.single()
            if not patient_record:
                return {"error": f"No patient found with ID/name: {patient_id}"}
            
            patient_name = patient_record["patient_name"]
            patient_id_db = patient_record["id"]
            
            journey_steps = []
            seen_steps = set()
            
            # Get diagnoses
            diag_result = session.run(
                """
                MATCH (p:Patient)-[hd:HAS_DIAGNOSIS]->(diag:Diagnosis)
                WHERE p.patientId = $patient_id AND diag.name IS NOT NULL AND hd.diagnosedDate IS NOT NULL
                RETURN diag.name as name, diag.description as desc, hd.diagnosedDate as date
                """,
                patient_id=patient_id_db
            )
            
            for record in diag_result:
                if record.get("name"):
                    step = f"Diagnosed with {record['name']} ({record.get('desc', '')}) on {record.get('date', 'Unknown Date')}"
                    if step not in seen_steps:
                        seen_steps.add(step)
                        journey_steps.append((record.get('date', ''), step))
            
            # Get appointments
            appt_result = session.run(
                """
                MATCH (p:Patient)-[ha:HAS_APPOINTMENT]->(appt:Appointment)
                WHERE p.patientId = $patient_id AND appt.type IS NOT NULL AND ha.appointmentDate IS NOT NULL
                OPTIONAL MATCH (appt)-[:WITH_DOCTOR]->(doc:Doctor)
                OPTIONAL MATCH (appt)-[:AT_HOSPITAL]->(hosp:Hospital)
                RETURN appt.type as type, ha.appointmentDate as date, ha.status as status, 
                       doc.name as doctor_name, hosp.name as hospital_name
                """,
                patient_id=patient_id_db
            )
            
            for record in appt_result:
                if record.get("type") and record.get("date"):
                    doctor = record.get('doctor_name') or 'Unknown Provider'
                    hospital = record.get('hospital_name') or 'Unknown Location'
                    step = f"Had a {record.get('type', 'Unknown')} appointment on {record.get('date', 'Unknown Date')} ({record.get('status', 'Unknown')}) with {doctor} at {hospital}"
                    if step not in seen_steps:
                        seen_steps.add(step)
                        journey_steps.append((record.get('date', ''), step))
            
            # Get medications
            med_result = session.run(
                """
                MATCH (p:Patient)-[tm:TAKES_MEDICATION]->(med:Medication)
                WHERE p.patientId = $patient_id AND med.name IS NOT NULL AND tm.prescribedDate IS NOT NULL
                RETURN med.name as name, med.dosage as dosage, med.frequency as freq, tm.prescribedDate as date
                """,
                patient_id=patient_id_db
            )
            
            for record in med_result:
                if record.get("name") and record.get("date"):
                    step = f"Prescribed {record['name']} {record.get('dosage', '')} {record.get('freq', '')} on {record.get('date', 'Unknown Date')}"
                    if step not in seen_steps:
                        seen_steps.add(step)
                        journey_steps.append((record.get('date', ''), step))
            
            # Get treatments
            treat_result = session.run(
                """
                MATCH (p:Patient)-[rt:RECEIVES_TREATMENT]->(treat:Treatment)
                WHERE p.patientId = $patient_id AND treat.name IS NOT NULL AND rt.startDate IS NOT NULL
                RETURN treat.name as name, rt.startDate as start, rt.endDate as end, treat.status as status
                """,
                patient_id=patient_id_db
            )
            
            for record in treat_result:
                if record.get("name") and record.get("start"):
                    step = f"Started treatment: {record['name']} from {record.get('start', 'Unknown Date')} to {record.get('end', 'Unknown End Date')} (Status: {record.get('status', 'Unknown')})"
                    if step not in seen_steps:
                        seen_steps.add(step)
                        journey_steps.append((record.get('start', ''), step))
            
            # Get tests
            test_result = session.run(
                """
                MATCH (p:Patient)-[ut:UNDERWENT_TEST]->(test:Test)
                WHERE p.patientId = $patient_id AND test.name IS NOT NULL AND ut.performedDate IS NOT NULL
                RETURN test.name as name, ut.performedDate as date, test.result as result, test.status as status
                """,
                patient_id=patient_id_db
            )
            
            for record in test_result:
                if record.get("name") and record.get("date"):
                    step = f"Had {record['name']} on {record.get('date', 'Unknown Date')} - Result: {record.get('result', 'Unknown')} (Status: {record.get('status', 'Unknown')})"
                    if step not in seen_steps:
                        seen_steps.add(step)
                        journey_steps.append((record.get('date', ''), step))
            
            # Sort by date (descending)
            journey_steps.sort(key=lambda x: (x[0] or ''), reverse=True)
            
            # Extract just the steps
            final_steps = [step for _, step in journey_steps]

            return {
                "patient_name": patient_name,
                "journey_steps": final_steps
            }

    def close(self):
        self.driver.close()