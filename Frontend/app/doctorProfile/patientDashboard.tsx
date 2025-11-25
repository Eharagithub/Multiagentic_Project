import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert,
} from 'react-native';
import { styles } from './patientDashboard.styles';
import BottomNavigation from '../common/BottomNavigation';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather, MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../../config/firebaseConfig';
import PatientMedicationsModal, { MedicationData } from './patientMedications';
import ScheduleVisitModal, { VisitData } from './scheduleVisit';
import JourneyBotModal from './journeytracker';
import useUserProfile from '../../hooks/useUserProfile';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import authService from '../../services/authService';
import {
    fetchPatientPersonalData,
    fetchPatientHealthData,
    fetchActiveMedications,
    fetchNextScheduledVisit,
    fetchAllPatientVaultRecords,
    fetchAllPatientLabReports,
    DateGroup,
    DocumentRecord
} from '../../services/firestoreQueries';
import {
    isPatientRegistered,
    storeMedicationForNewPatient,
    storeVisitForNewPatient,
} from '../../services/newpatient_functions';

// Interfaces
export interface Allergy {
    id: string;
    name: string;
    description: string;
}

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    status: 'Active' | 'Inactive';
}

export interface PatientInfo {
    name: string;
    age: number;
    location: string;
    bloodType: string;
    nextVisit: string;
}

const PatientDashboard: React.FC = () => {
    const { data: doctorData } = useUserProfile();
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'reports'>('overview');
    const [patientStatus, setPatientStatus] = useState<'verified' | 'pending' | 'invited'>('invited');
    const [medicationModalVisible, setMedicationModalVisible] = useState(false);
    const [scheduleVisitModalVisible, setScheduleVisitModalVisible] = useState(false);
    const [journeyTrackerModalVisible, setJourneyTrackerModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [currentPatientUid, setCurrentPatientUid] = useState<string>('');
    const [nextVisit, setNextVisit] = useState<any>(null);
    const [patientInfo, setPatientInfo] = useState<PatientInfo>({
        name: 'Loading...',
        age: 0,
        location: 'N/A',
        bloodType: 'N/A',
        nextVisit: 'TBD',
    });
    const [allergies, setAllergies] = useState<Allergy[]>([]);
    const [activeMedications, setActiveMedications] = useState<any[]>([]);
    const [vaultRecords, setVaultRecords] = useState<DateGroup[]>([]);
    const [labRecords, setLabRecords] = useState<DateGroup[]>([]);
    const router = useRouter();
    const params = useLocalSearchParams();

    // Fetch patient link data and patient details from params
    useEffect(() => {
        const doctorId = auth.currentUser?.uid;
        const linkIdParam = params.linkId as string;

        console.log('🔐 useEffect triggered - doctorId:', doctorId, 'linkId:', linkIdParam);

        if (!doctorId || !linkIdParam) {
            console.warn('⚠️ Missing doctorId or linkId, skipping fetch');
            return;
        }

        // Fetch the patient link document to get patient UID and status
        const unsubscribe = db
            .collection('Doctor')
            .doc(doctorId)
            .collection('patients')
            .doc(linkIdParam)
            .onSnapshot(
                async (doc) => {
                    if (doc.exists) {
                        console.log('✅ Patient link document found:', doc.data());
                        const linkData = doc.data();
                        setPatientStatus((linkData?.status || 'invited') as 'verified' | 'pending' | 'invited');

                        const uid = linkData?.patientId;
                        setCurrentPatientUid(uid);
                        console.log('🔑 Patient UID extracted:', uid);
                        if (uid) {
                            await fetchPatientData(uid, linkData);
                        } else {
                            console.warn('⚠️ No patientId found in link document');
                        }
                    } else {
                        console.warn('⚠️ Patient link document not found');
                    }
                },
                (err) => {
                    console.error('❌ Error fetching patient link:', err);
                }
            );

        return () => unsubscribe();
    }, [params.linkId]);

// fetchPatientData function
const fetchPatientData = async (patientUid: string, linkData?: any) => {
  try {
    console.log('📥 Starting to fetch patient data for UID:', patientUid);

    // ===== SET DOCTOR-ENTERED DATA FOR NON-REGISTERED PATIENTS =====
    if (linkData && linkData.fullName) {
      console.log('📋 Patient not yet registered - using doctor-entered data:', {
        name: linkData.fullName,
        age: linkData.age
      });
      
      // Set patient info with doctor-entered data for non-registered patients
      setPatientInfo(prev => ({
        ...prev,
        name: linkData.fullName,
        age: linkData.age ? parseInt(linkData.age) : 0,
      }));
      
      // Skip fetching from Patient collection since patient hasn't signed up yet
      console.log('⏭️ Skipping Patient collection fetch for non-registered patient');
    } else {
        
      // ===== FETCH PERSONAL DATA FROM PATIENT COLLECTION =====
      try {
        const personalInfo = await fetchPatientPersonalData(patientUid);
        if (personalInfo) {
          setPatientInfo(prev => ({ ...prev, ...personalInfo }));
        }
      } catch (personalErr) {
        console.error('❌ Error fetching personal data:', personalErr);
      }
    }

    // ===== FETCH HEALTH/COMMON DATA =====
    try {
      const healthData = await fetchPatientHealthData(patientUid);
      setAllergies(healthData.allergies);
      setPatientInfo(prev => ({ ...prev, bloodType: healthData.bloodType }));
    } catch (healthErr) {
      console.error('❌ Error fetching health data:', healthErr);
    }

    // ===== FETCH ACTIVE MEDICATIONS =====
    try {
      const activeMeds = await fetchActiveMedications(patientUid);
      console.log('💊 Active medications loaded:', activeMeds.length);
      setActiveMedications(activeMeds);
    } catch (activeMedsErr) {
      console.error('❌ Error fetching active medications:', activeMedsErr);
      setActiveMedications([]);
    }

    // ===== SMART FETCH VAULT RECORDS =====
    try {
      // Use the same logic as viewhistory.tsx - fetch ALL vault records
      const vaultData = await fetchAllPatientVaultRecords(patientUid);
      setVaultRecords(vaultData);
      console.log('📦 All vault records loaded:', vaultData.length, 'date groups');
    } catch (vaultErr) {
      console.error('❌ Error in vault records fetch:', vaultErr);
      setVaultRecords([]);
    }

    // ===== SMART FETCH LAB REPORTS =====
    try {
      // Use the same logic as labresults.tsx - fetch ALL lab reports
      const labData = await fetchAllPatientLabReports(patientUid);
      setLabRecords(labData);
      console.log('📊 All lab reports loaded:', labData.length, 'date groups');
    } catch (labErr) {
      console.error('❌ Error in lab reports fetch:', labErr);
      setLabRecords([]);
    }

    // ===== FETCH NEXT SCHEDULED VISIT =====
    try {
      const visitData = await fetchNextScheduledVisit(patientUid);
      setNextVisit(visitData);
      console.log('📅 Next visit loaded:', visitData);
    } catch (visitErr) {
      console.error('❌ Error fetching next visit:', visitErr);
      setNextVisit(null);
    }

    console.log('✅ Finished fetching all patient data');
  } catch (err) {
    console.error('❌ Critical error fetching patient data:', err);
  }
};
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'verified':
                return '#4CAF50';
            case 'pending':
                return '#FF9800';
            case 'invited':
                return '#2196F3';
            default:
                return '#999999';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'verified':
                return 'Verified ✓';
            case 'pending':
                return 'Awaiting Verification';
            case 'invited':
                return 'Invitation Sent';
            default:
                return 'Unknown';
        }
    };

    const handleBack = () => {
        router.back();
    };

    const handleUploadDocument = async () => {
        try {
            if (!currentPatientUid) {
                Alert.alert('Error', 'Patient ID not found');
                return;
            }

            const doctorUid = auth.currentUser?.uid;
            if (!doctorUid) {
                Alert.alert('Not signed in', 'Doctor must be signed in to upload files.');
                return;
            }

            // Open document picker
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            // Handle result
            let file: any = null;
            if ((result as any).type === 'success') {
                const r: any = result;
                file = {
                    name: r.name || 'file',
                    uri: r.uri,
                    type: r.mimeType || r.type || 'unknown',
                    size: r.size || 0,
                };
            } else if ((result as any).assets && Array.isArray((result as any).assets) && (result as any).assets.length > 0) {
                const r: any = (result as any).assets[0];
                file = {
                    name: r.name || r.fileName || 'file',
                    uri: r.uri,
                    type: r.mimeType || r.type || 'unknown',
                    size: r.size || 0,
                };
            } else {
                // User cancelled
                return;
            }

            if (!file) return;

            setUploading(true);

            try {
                const dateKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

                // Read file as base64
                let base64 = '';
                try {
                    base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' } as any);
                } catch (readErr) {
                    console.error('Failed to read file as base64:', readErr);
                    Alert.alert('Upload failed', 'Unable to read the selected file.');
                    setUploading(false);
                    return;
                }

                // Validate file size
                const MAX_BASE64_CHARS = 1040000;
                if (base64.length > MAX_BASE64_CHARS) {
                    Alert.alert('File too large', 'This file is too large. Please reduce the file size.');
                    setUploading(false);
                    return;
                }

                const sizeEstimate = file.size || Math.floor((base64.length * 3) / 4);
                const fileRecord: any = {
                    name: file.name,
                    originalName: file.name,
                    type: file.type || '',
                    size: sizeEstimate,
                    contentBase64: base64,
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: doctorUid,
                    uploadedByRole: 'doctor',
                    date: dateKey,
                    category: 'medical',
                };

                // Save to patient's vault
                const res = await authService.saveVaultDocument(currentPatientUid, fileRecord, 'patient');

                if (res.success) {
                    Alert.alert('Success', 'Medical record uploaded to patient\'s vault.');
                    // Refresh patient data
                    await fetchPatientData(currentPatientUid);
                } else {
                    Alert.alert('Upload failed', res.error || 'Failed to save document record');
                }
            } catch (err) {
                console.error('Upload failed:', err);
                Alert.alert('Upload failed', 'Failed to upload file.');
            } finally {
                setUploading(false);
            }
        } catch (err) {
            console.error('Error in handleUploadDocument:', err);
            Alert.alert('Error', 'An error occurred while uploading the document.');
        }
    };

    const handleMedicationSubmit = async (medicationData: MedicationData) => {
        try {
            if (!currentPatientUid) {
                Alert.alert('Error', 'Patient UID not found');
                return;
            }

            const doctorUid = auth.currentUser?.uid;
            console.log('💊 Prescribing medication:');
            console.log('   Doctor UID:', doctorUid);
            console.log('   Patient UID:', currentPatientUid);
            console.log('   Medication:', medicationData.drugName);

            // Check if patient is registered
            const isRegistered = await isPatientRegistered(currentPatientUid);
            console.log('📋 Patient registered:', isRegistered);

            if (isRegistered) {
                // Save to Patient collection for registered patients
                const medicationRef = db
                    .collection('Patient')
                    .doc(currentPatientUid)
                    .collection('health')
                    .doc('activemedications')
                    .collection('medications')
                    .doc();

                console.log('📝 Writing to Patient collection...');
                await medicationRef.set({
                    id: medicationRef.id,
                    ...medicationData,
                    prescribedBy: doctorUid,
                    prescribedAt: new Date().toISOString(),
                    status: 'Active',
                });
            } else {
                // Save to publicPatients collection for non-registered patients
                console.log('📝 Writing to publicPatients collection...');
                await storeMedicationForNewPatient(
                    currentPatientUid,
                    {
                        drugName: medicationData.drugName,
                        dosage: medicationData.dosage,
                        frequency: medicationData.frequency,
                        duration: medicationData.duration,
                        instructions: medicationData.instructions,
                    },
                    doctorUid!
                );
            }

            console.log('✅ Medication prescribed successfully:', medicationData);
            setMedicationModalVisible(false);
            // Refresh the medications list
            await fetchPatientData(currentPatientUid);
        } catch (err: any) {
            console.error('❌ Error prescribing medication:', err);
            console.error('   Error Code:', err.code);
            console.error('   Error Message:', err.message);
            Alert.alert('Error', `Failed to prescribe medication: ${err.message}`);
        }
    };

    const handleDeleteMedication = async (medicationId: string, medicationName: string) => {
        Alert.alert(
            'Delete Medication',
            `Are you sure you want to delete ${medicationName}?`,
            [
                { text: 'Cancel', onPress: () => {} },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            if (!currentPatientUid) {
                                Alert.alert('Error', 'Patient UID not found');
                                return;
                            }

                            const isRegistered = await isPatientRegistered(currentPatientUid);

                            if (isRegistered) {
                                // Delete from Patient collection
                                await db
                                    .collection('Patient')
                                    .doc(currentPatientUid)
                                    .collection('health')
                                    .doc('activemedications')
                                    .collection('medications')
                                    .doc(medicationId)
                                    .delete();
                                console.log('✅ Medication deleted from Patient collection');
                            } else {
                                // Delete from publicPatients collection
                                await db
                                    .collection('publicPatients')
                                    .doc(currentPatientUid)
                                    .collection('health')
                                    .doc('activemedications')
                                    .collection('medications')
                                    .doc(medicationId)
                                    .delete();
                                console.log('✅ Medication deleted from publicPatients collection');
                            }

                            Alert.alert('Success', 'Medication deleted successfully');
                            // Refresh the medications list
                            await fetchPatientData(currentPatientUid);
                        } catch (err: any) {
                            console.error('❌ Error deleting medication:', err);
                            Alert.alert('Error', `Failed to delete medication: ${err.message}`);
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const handleScheduleVisit = async (visitData: VisitData) => {
        try {
            if (!currentPatientUid) {
                Alert.alert('Error', 'Patient UID not found');
                return;
            }

            const doctorUid = auth.currentUser?.uid;
            console.log('📅 Scheduling visit:');
            console.log('   Doctor UID:', doctorUid);
            console.log('   Patient UID:', currentPatientUid);
            console.log('   Date:', visitData.date);
            console.log('   Time:', visitData.time);

            // Fetch doctor's name
            let doctorName = 'Your doctor';
            
            // First try to get from useUserProfile hook data
            if (doctorData?.personal?.fullName) {
                doctorName = doctorData.personal.fullName;
                console.log('✅ Doctor name from profile:', doctorName);
            } else {
                // Fallback: fetch from Firestore if hook data not available
                if (doctorUid) {
                    try {
                        const doctorDoc = await db.collection('Doctor').doc(doctorUid).get();
                        if (doctorDoc.exists) {
                            const data = doctorDoc.data();
                            console.log('📄 Doctor data retrieved:', data);
                            doctorName = data?.personal?.fullName || data?.fullName || 'Your doctor';
                            console.log('✅ Doctor name resolved to:', doctorName);
                        } else {
                            console.warn('⚠️ Doctor document does not exist for UID:', doctorUid);
                        }
                    } catch (err) {
                        console.warn('⚠️ Could not fetch doctor name from Firestore:', err);
                    }
                }
            }

            // Check if patient is registered
            const isRegistered = await isPatientRegistered(currentPatientUid);
            console.log('📋 Patient registered:', isRegistered);

            const visitDateTime = `${visitData.date}T${visitData.time}`;

            if (isRegistered) {
                // Save visit to Patient collection for registered patients
                const visitRef = db
                    .collection('Patient')
                    .doc(currentPatientUid)
                    .collection('health')
                    .doc('visitSchedule')
                    .collection('scheduled')
                    .doc();

                console.log('📝 Writing to Patient collection...');
                await visitRef.set({
                    id: visitRef.id,
                    visitDate: visitData.date,
                    visitTime: visitData.time,
                    visitDateTime: visitDateTime,
                    visitType: visitData.visitType,
                    notes: visitData.notes,
                    scheduledBy: doctorUid,
                    doctorName: doctorName,
                    scheduledAt: new Date().toISOString(),
                    status: 'Scheduled',
                });

                // Save notification for registered patient
                const notificationRef = db
                    .collection('Patient')
                    .doc(currentPatientUid)
                    .collection('notifications')
                    .doc();

                console.log('📝 Creating notification at path: Patient/', currentPatientUid, '/notifications/', notificationRef.id);

                await notificationRef.set({
                    id: notificationRef.id,
                    type: 'visit_scheduled',
                    title: 'Visit Scheduled',
                    message: `DR. ${doctorName} has scheduled a visit on ${new Date(visitData.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })} at ${visitData.time}`,
                    visitDate: visitData.date,
                    visitTime: visitData.time,
                    visitType: visitData.visitType,
                    doctorName: doctorName,
                    createdAt: new Date().toISOString(),
                    read: false,
                });
            } else {
                // Save visit to publicPatients collection for non-registered patients
                console.log('📝 Writing to publicPatients collection...');
                await storeVisitForNewPatient(
                    currentPatientUid,
                    {
                        date: visitData.date,
                        time: visitData.time,
                        visitType: visitData.visitType,
                        notes: visitData.notes,
                    },
                    doctorUid!,
                    doctorName
                );
            }

            console.log('✅ Visit scheduled successfully');
            setScheduleVisitModalVisible(false);
            // Refresh the data
            await fetchPatientData(currentPatientUid);
        } catch (err: any) {
            console.error('❌ Error scheduling visit:', err);
            console.error('   Error Code:', err.code);
            console.error('   Error Message:', err.message);
            Alert.alert('Error', `Failed to schedule visit: ${err.message}`);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                >
                    <Feather name="chevron-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Patient Details</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Patient Details Header */}
            <View style={styles.patientHeader}>
                {/* Profile Section with Picture and Basic Info in one line */}
                <View style={styles.profileMainRow}>
                    <View style={styles.profileImageContainer}>
                        <View style={styles.profileIconContainer}>
                            <Feather name="user" size={24} color="#7d4c9e" />
                        </View>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.patientName}>{patientInfo.name}</Text>
                        <View style={styles.patientDetailsRow}>
                            <Text style={styles.patientAgeLocation}>{patientInfo.age} yrs • {patientInfo.location}</Text>
                        </View>
                        <View style={styles.bloodTypeContainer}>
                            <MaterialCommunityIcons name="water" size={16} color="#666" />
                            <Text style={styles.bloodType}>Blood: {patientInfo.bloodType}</Text>
                        </View>
                    </View>

                </View>

                {/* Status Badge */}
                <View style={{
                    backgroundColor: getStatusColor(patientStatus),
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    alignSelf: 'flex-start',
                    marginBottom: 12,
                }}>
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
                        {getStatusText(patientStatus)}
                    </Text>
                </View>

                {/* Action Buttons with Icons
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.callButton}>
                        <FontAwesome name="phone" size={16} color="#fff" />
                        <Text style={styles.callButtonText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.callButton}>
                        <Feather name="message-circle" size={16} color="#fff" />
                        <Text style={styles.callButtonText}>Message</Text>
                    </TouchableOpacity>
                </View> */}

                  {/* Action Buttons with Icons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.callButton} onPress={handleUploadDocument}
                    disabled={uploading}>
                        <MaterialIcons name="cloud-upload" size={16} color="#fff" />
                        <Text style={styles.callButtonText}>{uploading ? 'Uploading...' : 'Upload Documents'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.callButton} onPress={() => setJourneyTrackerModalVisible(true)}>
                        <Ionicons name="stats-chart" size={16} color="#fff" />
                        <Text style={styles.callButtonText}>Journey Tracker</Text>
                    </TouchableOpacity>
                </View>
            </View>


            {/* Upload Documents with Icon
            <View style={styles.uploadButtons}>
                <TouchableOpacity 
                    style={styles.uploadSection}
                    onPress={handleUploadDocument}
                    disabled={uploading}
                >
                    <MaterialIcons name="cloud-upload" size={20} color="#7d4c9e" />
                    <Text style={styles.uploadText}>{uploading ? 'Uploading...' : 'Upload Documents'}</Text>
                </TouchableOpacity>

                {/* Progress Monitor with Icon */}
                {/*<TouchableOpacity 
                    style={styles.progressSection}
                    onPress={() => setJourneyTrackerModalVisible(true)}
                >
                    <Ionicons name="stats-chart" size={20} color="#7d4c9e" />
                    <Text style={styles.progressText}>Journey Tracker</Text>
                </TouchableOpacity>
            </View> */}

            {/* Navigation Tabs */}
            <View style={styles.navTabs}>
                <TouchableOpacity
                    style={[styles.navTab, activeTab === 'overview' && styles.activeTab]}
                    onPress={() => setActiveTab('overview')}
                >
                    <Text style={[styles.navTabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.navTab, activeTab === 'history' && styles.activeTab]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text style={[styles.navTabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.navTab, activeTab === 'reports' && styles.activeTab]}
                    onPress={() => setActiveTab('reports')}
                >
                    <Text style={[styles.navTabText, activeTab === 'reports' && styles.activeTabText]}>Reports</Text>
                </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {activeTab === 'overview' && (
                    <>
                        {/* Allergies Section with Icon */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleContainer}>
                                    <MaterialCommunityIcons name="allergy" size={20} color="#7d4c9e" />
                                    <Text style={styles.sectionTitle}>Allergies</Text>
                                </View>
                                <TouchableOpacity style={styles.seeAllButton}>
                                    <Text style={styles.seeAllText}>See all</Text>
                                    <Feather name="chevron-right" size={16} color="#7d4c9e" />
                                </TouchableOpacity>
                            </View>
                            {allergies.map((allergy, index) => (
                                <View key={allergy.id} style={[
                                    styles.allergyItem,
                                    index === allergies.length - 1 && styles.allergyItemLast
                                ]}>
                                    <View style={styles.allergyIconContainer}>
                                        <MaterialCommunityIcons name="alert-circle" size={16} color="#ff6b6b" />
                                    </View>
                                    <View style={styles.allergyContent}>
                                        <Text style={styles.allergyName}>{allergy.name}</Text>
                                        <Text style={styles.allergyDescription}>{allergy.description}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Active Medications Section with Icon */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleContainer}>
                                    <FontAwesome name="medkit" size={18} color="#7d4c9e" />
                                    <Text style={styles.sectionTitle}>Active Medications</Text>
                                </View>
                                <TouchableOpacity style={styles.seeAllButton}>
                                    <Text style={styles.seeAllText}>See all</Text>
                                    <Feather name="chevron-right" size={16} color="#7d4c9e" />
                                </TouchableOpacity>
                            </View>
                            {activeMedications.length > 0 ? (
                                activeMedications.map((med) => (
                                    <View key={med.id} style={styles.medicationItem}>
                                        <View style={styles.medicationHeader}>
                                            <View style={styles.medicationNameContainer}>
                                                <MaterialCommunityIcons name="pill" size={16} color="#7d4c9e" />
                                                <Text style={styles.medicationName}>{med.drugName}</Text>
                                            </View>
                                            <View style={[styles.statusBadge, med.status === 'Active' ? styles.activeBadge : styles.inactiveBadge]}>
                                                <Text style={styles.statusText}>{med.status}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.medicationDetails}>
                                            {med.dosage} - {med.frequency}
                                        </Text>
                                        <Text style={styles.medicationDuration}>Duration: {med.duration}</Text>
                                        {/* Edit and Delete Buttons */}
                                        <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
                                            <TouchableOpacity 
                                                style={{ 
                                                    flex: 1, 
                                                    paddingVertical: 8, 
                                                    paddingHorizontal: 12, 
                                                    backgroundColor: '#E3F2FD', 
                                                    borderRadius: 6,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 6
                                                }}
                                                onPress={() => {
                                                    // TODO: Implement edit functionality
                                                    Alert.alert('Info', 'Edit functionality coming soon');
                                                }}
                                            >
                                                <Feather name="edit-2" size={14} color="#1976D2" />
                                                <Text style={{ color: '#1976D2', fontSize: 12, fontWeight: '600' }}>Edit</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={{ 
                                                    flex: 1, 
                                                    paddingVertical: 8, 
                                                    paddingHorizontal: 12, 
                                                    backgroundColor: '#FFEBEE', 
                                                    borderRadius: 6,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 6
                                                }}
                                                onPress={() => handleDeleteMedication(med.id, med.drugName)}
                                            >
                                                <Feather name="trash-2" size={14} color="#D32F2F" />
                                                <Text style={{ color: '#D32F2F', fontSize: 12, fontWeight: '600' }}>Delete</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={{ color: '#999', fontStyle: 'italic', marginTop: 8 }}>No active medications prescribed</Text>
                            )}
                        </View>

                        {/* Provide Medications Button with Icon */}
                        <TouchableOpacity 
                            style={styles.provideMedicationsButton}
                            onPress={() => setMedicationModalVisible(true)}
                        >
                            <MaterialCommunityIcons name="prescription" size={20} color="#fff" />
                            <Text style={styles.provideMedicationsText}>Provide Medications</Text>
                        </TouchableOpacity>

                        {/* Next Visit Section with Icon */}
                        <View style={styles.nextVisitSection}>
                            <MaterialCommunityIcons name="calendar-clock" size={24} color="#7d4c9e" />
                            <Text style={styles.nextVisitTitle}>Next Visit</Text>
                            {nextVisit ? (
                                <>
                                    <Text style={styles.nextVisitDate}>
                                        {new Date(nextVisit.visitDate).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                        })} at {nextVisit.visitTime}
                                    </Text>
                                    <Text style={styles.nextVisitType}>{nextVisit.visitType}</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.nextVisitDate}>No visit scheduled</Text>
                                    <Text style={styles.nextVisitType}>Schedule a visit for the patient</Text>
                                </>
                            )}
                            <TouchableOpacity 
                                style={styles.scheduleButton}
                                onPress={() => setScheduleVisitModalVisible(true)}
                            >
                                <Feather name="calendar" size={16} color="#fff" />
                                <Text style={styles.scheduleButtonText}>Schedule Visit</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {activeTab === 'history' && (
                    <View>
                        {/* Diagnosis History Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleContainer}>
                                    <Feather name="book-open" size={20} color="#7d4c9e" />
                                    <Text style={styles.sectionTitle}>Medical Records</Text>
                                </View>
                            </View>

                            {vaultRecords.length > 0 ? (
                                vaultRecords.map((dateGroup: DateGroup, dateIndex: number) => (
                                    <View key={dateGroup.date}>
                                        {/* Date Header */}
                                        <Text style={styles.diagnosisDate}>
                                            {new Date(dateGroup.date).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            })}
                                        </Text>

                                        {/* Documents for this date */}
                                        {dateGroup.documents.map((record: DocumentRecord, docIndex: number) => (
                                            <TouchableOpacity
                                                key={record.id}
                                                style={styles.medicationItem}
                                                onPress={() => {
                                                    router.push({
                                                        pathname: '/patientProfile/viewHistory/vault',
                                                        params: {
                                                            uid: currentPatientUid,
                                                            date: dateGroup.date,
                                                            docId: record.id
                                                        }
                                                    });
                                                }}
                                            >
                                                <View style={styles.medicationHeader}>
                                                    <Text style={styles.medicationName}>{record.title}</Text>
                                                    <Feather name="chevron-right" size={16} color="#ccc" />
                                                </View>
                                                {record.description && (
                                                    <Text style={styles.medicationDetails}>{record.description}</Text>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))
                            ) : (
                                <Text style={{ textAlign: 'center', color: '#999', marginVertical: 16 }}>
                                    No medical history records found
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {activeTab === 'reports' && (
                    <View>
                        {/* Lab Results Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleContainer}>
                                    <Feather name="file" size={20} color="#7d4c9e" />
                                    <Text style={styles.sectionTitle}>Lab Reports</Text>
                                </View>
                            </View>

                            {labRecords.length > 0 ? (
                                labRecords.map((dateGroup: DateGroup, dateIndex: number) => (
                                    <View key={dateGroup.date}>
                                        {/* Date Header */}
                                        <Text style={styles.diagnosisDate}>
                                            {new Date(dateGroup.date).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            })}
                                        </Text>

                                        {/* Documents for this date */}
                                        {dateGroup.documents.map((report: DocumentRecord, docIndex: number) => (
                                            <TouchableOpacity
                                                key={report.id}
                                                style={styles.medicationItem}
                                                onPress={() => {
                                                    router.push({
                                                        pathname: '/doctorProfile/patientvault',
                                                        params: {
                                                            uid: currentPatientUid,
                                                            date: dateGroup.date,
                                                            docId: report.id
                                                        }
                                                    });
                                                }}
                                            >
                                                <View style={styles.medicationHeader}>
                                                    <Text style={styles.medicationName}>{report.title}</Text>
                                                    <Feather name="chevron-right" size={16} color="#ccc" />
                                                </View>
                                                {report.description && (
                                                    <Text style={styles.medicationDetails}>{report.description}</Text>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))
                            ) : (
                                <Text style={{ textAlign: 'center', color: '#999', marginVertical: 16 }}>
                                    No lab reports found
                                </Text>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Navigation to match app screens */}
            <BottomNavigation activeTab="home" />

            {/* Medications Modal */}
            <PatientMedicationsModal
                visible={medicationModalVisible}
                onClose={() => setMedicationModalVisible(false)}
                onSubmit={handleMedicationSubmit}
                patientId={currentPatientUid}
            />

            {/* Schedule Visit Modal */}
            <ScheduleVisitModal
                visible={scheduleVisitModalVisible}
                onClose={() => setScheduleVisitModalVisible(false)}
                onSubmit={handleScheduleVisit}
                patientId={currentPatientUid}
            />

            {/* Journey Tracker Modal */}
            <JourneyBotModal
                isVisible={journeyTrackerModalVisible}
                onClose={() => setJourneyTrackerModalVisible(false)}
            />
        </SafeAreaView>
    );
};

export default PatientDashboard;