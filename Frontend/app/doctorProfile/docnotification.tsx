import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db } from '../../config/firebaseConfig';
import BottomNavigation from '../common/BottomNavigation';
import { collection, getDocs } from 'firebase/firestore';

interface ScheduledVisit {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  visitType: string;
  notes: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt: string;
  doctorId: string;
  linkStatus?: 'verified' | 'invited' | 'pending';
}

interface GroupedVisits {
  [date: string]: ScheduledVisit[];
}

export default function DocNotification() {
  const router = useRouter();
  const [visits, setVisits] = useState<ScheduledVisit[]>([]);
  const [groupedVisits, setGroupedVisits] = useState<GroupedVisits>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [doctorId, setDoctorId] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Not Authenticated', 'Please sign in as a doctor');
        router.replace('../auth/Auth/login');
        return;
      }
      setDoctorId(currentUser.uid);
      await fetchScheduledVisits(currentUser.uid);
    };

    checkAuth();

    // Set up real-time listener for visit updates
    if (doctorId) {
      console.log('[docnotification] Setting up real-time listener for visit updates...');
      const unsubscribes: (() => void)[] = [];

      // Listen to doctor's patients
      const patientsRef = collection(db, 'Doctor', doctorId, 'patients');
      const unsubscribePatients = getDocs(patientsRef).then((patientsSnapshot) => {
        patientsSnapshot.forEach((patientLinkDoc) => {
          const patientLinkData = patientLinkDoc.data();
          const patientId = patientLinkData.patientId;

          if (patientId) {
            // Listen to each patient's scheduled visits
            const schedulesRef = collection(
              db,
              'Patient',
              patientId,
              'health',
              'visitSchedule',
              'scheduled'
            );

            // This would require onSnapshot instead of getDocs
            // For now, we rely on pull-to-refresh and periodic updates
            console.log(
              `[docnotification] Monitoring visits for patient: ${patientLinkData.fullName}`
            );
          }
        });
      });

      return () => {
        // Cleanup listeners
        unsubscribes.forEach((unsub) => unsub());
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine visit status based on date and time
  const determineVisitStatus = (dateStr: string, timeStr: string): 'upcoming' | 'completed' | 'cancelled' => {
    try {
      const visitDateTime = new Date(`${dateStr}T${timeStr}`);
      const now = new Date();
      
      // If visit is in the future, it's upcoming
      if (visitDateTime > now) {
        return 'upcoming';
      }
      // If visit is in the past, it's completed (unless manually marked cancelled)
      return 'completed';
    } catch (error) {
      console.log('[docnotification] Error determining visit status:', error);
      return 'upcoming'; // Default to upcoming
    }
  };

  // Fetch all scheduled visits for doctor's patients (both verified and invited)
  const fetchScheduledVisits = async (uid: string) => {
    setLoading(true);
    try {
      console.log('[docnotification] Fetching all doctor patients and their scheduled visits...');

      // Step 1: Get all patients linked to this doctor (both verified and invited)
      const patientsRef = collection(db, 'Doctor', uid, 'patients');
      const patientsSnapshot = await getDocs(patientsRef);

      const allVisits: ScheduledVisit[] = [];

      // Step 2: For each patient, fetch their scheduled visits from health/visitSchedule/scheduled
      for (const patientLinkDoc of patientsSnapshot.docs) {
        const patientLinkData = patientLinkDoc.data();
        const patientId = patientLinkData.patientId;
        const patientName = patientLinkData.fullName || 'Unknown Patient';
        const linkStatus = patientLinkData.status; // 'verified', 'invited', 'pending'

        console.log(
          `[docnotification] Checking patient: ${patientName} (${patientId}) - Status: ${linkStatus}`
        );

        if (!patientId) continue;

        try {
          // Fetch schedules from Patient/{patientId}/health/visitSchedule/scheduled
          const schedulesRef = collection(
            db,
            'Patient',
            patientId,
            'health',
            'visitSchedule',
            'scheduled'
          );
          const schedulesSnapshot = await getDocs(schedulesRef);

          if (!schedulesSnapshot.empty) {
            console.log(
              `[docnotification] Found ${schedulesSnapshot.size} scheduled visits for patient ${patientName}`
            );

            schedulesSnapshot.forEach((scheduleDoc) => {
              const scheduleData = scheduleDoc.data();
              
              // Only include visits scheduled by this doctor
              if (scheduleData.scheduledBy === uid) {
                // Determine status based on visit date/time vs current time
                const visitDate = scheduleData.visitDate || scheduleData.date || '';
                const visitTime = scheduleData.visitTime || scheduleData.time || '';
                const calculatedStatus = determineVisitStatus(visitDate, visitTime);

                const visit: ScheduledVisit = {
                  id: scheduleDoc.id,
                  patientId,
                  patientName,
                  date: visitDate,
                  time: visitTime,
                  visitType: scheduleData.visitType || 'Consultation',
                  notes: scheduleData.notes || '',
                  status: calculatedStatus, // Dynamic status based on current time
                  createdAt: scheduleData.scheduledAt || new Date().toISOString(),
                  doctorId: uid,
                  linkStatus, // Track if patient is verified or invited
                };
                allVisits.push(visit);
              }
            });
          } else {
            console.log(`[docnotification] No scheduled visits found for patient ${patientName}`);
          }
        } catch (error) {
          console.log(
            `[docnotification] Error fetching scheduled visits for patient ${patientName}:`,
            error
          );
          // Continue to next patient
        }
      }

      // Step 3: Sort by date (newest first)
      allVisits.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`).getTime();
        const dateB = new Date(`${b.date}T${b.time}`).getTime();
        return dateB - dateA;
      });

      console.log(
        `[docnotification] Successfully loaded ${allVisits.length} total scheduled visits across ${patientsSnapshot.size} patients`
      );
      setVisits(allVisits);
      groupVisitsByDate(allVisits);
    } catch (error) {
      console.error('[docnotification] Error fetching visits:', error);
      Alert.alert('Error', 'Failed to load scheduled visits');
    } finally {
      setLoading(false);
    }
  };

  // Group visits by date
  const groupVisitsByDate = (visitsList: ScheduledVisit[]) => {
    const grouped: GroupedVisits = {};

    visitsList.forEach((visit) => {
      const dateKey = visit.date || 'Unknown Date';
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(visit);
    });

    // Sort dates in descending order
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(a).getTime();
      const dateB = new Date(b).getTime();
      return dateB - dateA;
    });

    const sortedGrouped: GroupedVisits = {};
    sortedKeys.forEach((key) => {
      sortedGrouped[key] = grouped[key];
    });

    setGroupedVisits(sortedGrouped);
  };

  // Filter visits based on active filter
  const getFilteredVisits = () => {
    if (activeFilter === 'all') return visits;
    return visits.filter((v) => v.status === activeFilter);
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (doctorId) {
        await fetchScheduledVisits(doctorId);
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Format date for display
  const formatDisplayDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
    } catch {
      return dateStr;
    }
  };

  // Format time
  const formatTime = (timeStr: string): string => {
    if (!timeStr) return 'Not specified';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Get status icon and color
  const getStatusIcon = (status: string): { icon: string; color: string } => {
    switch (status) {
      case 'upcoming':
        return { icon: 'clock-outline', color: '#3b82f6' };
      case 'completed':
        return { icon: 'check-circle', color: '#10b981' };
      case 'cancelled':
        return { icon: 'close-circle', color: '#ef4444' };
      default:
        return { icon: 'info-outline', color: '#666' };
    }
  };

  // Navigate to visit details
  const handleVisitPress = (visit: ScheduledVisit) => {
    router.push({
      pathname: '/doctorProfile/doctorHome',
      params: {
        visitId: visit.id,
        patientId: visit.patientId,
        patientName: visit.patientName,
        date: visit.date,
        time: visit.time,
        visitType: visit.visitType,
        notes: visit.notes,
        status: visit.status,
      },
    });
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Render visit card
  const renderVisitCard = (visit: ScheduledVisit) => {
    const statusInfo = getStatusIcon(visit.status);

    return (
      <TouchableOpacity
        key={visit.id}
        style={[
          styles.visitCard,
          visit.status === 'cancelled' && { opacity: 0.6 },
        ]}
        onPress={() => handleVisitPress(visit)}
        activeOpacity={0.7}
      >
        <View style={styles.visitCardContent}>
          {/* Left Section: Icon and Basic Info */}
          <View style={styles.leftSection}>
            <View style={[styles.statusIconContainer, { backgroundColor: statusInfo.color }]}>
              <MaterialCommunityIcons
                name={statusInfo.icon as any}
                size={20}
                color="#fff"
              />
            </View>
            <View style={styles.visitInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.patientName}>{visit.patientName}</Text>
                {visit.linkStatus && (
                  <View
                    style={[
                      styles.patientStatusBadge,
                      {
                        backgroundColor:
                          visit.linkStatus === 'verified' ? '#d1fae5' : '#fef3c7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.patientStatusText,
                        {
                          color:
                            visit.linkStatus === 'verified' ? '#065f46' : '#92400e',
                        },
                      ]}
                    >
                      {visit.linkStatus === 'verified' ? '✓ Verified' : 'Invited'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.visitType}>{visit.visitType}</Text>
            </View>
          </View>

          {/* Right Section: Time and Status */}
          <View style={styles.rightSection}>
            <View style={styles.timeContainer}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
              <Text style={styles.time}>{formatTime(visit.time)}</Text>
            </View>
            <Text
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    visit.status === 'upcoming'
                      ? '#dbeafe'
                      : visit.status === 'completed'
                      ? '#dcfce7'
                      : '#fee2e2',
                  color:
                    visit.status === 'upcoming'
                      ? '#1e40af'
                      : visit.status === 'completed'
                      ? '#065f46'
                      : '#b91c1c',
                },
              ]}
            >
              {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Notes Section */}
        {visit.notes && (
          <View style={styles.notesSection}>
            <MaterialCommunityIcons name="note-text" size={14} color="#999" />
            <Text style={styles.notes} numberOfLines={2}>
              {visit.notes}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render date group header
  const renderDateGroup = (dateKey: string, visitsList: ScheduledVisit[]) => (
    <View key={dateKey} style={styles.dateGroupContainer}>
      <View style={styles.dateHeader}>
        <MaterialCommunityIcons name="calendar-check" size={18} color="#7d4c9e" />
        <Text style={styles.dateTitle}>{formatDisplayDate(dateKey)}</Text>
        <View style={styles.visitCountBadge}>
          <Text style={styles.visitCount}>{visitsList.length}</Text>
        </View>
      </View>
      <View style={styles.visitsList}>
        {visitsList.map((visit) => renderVisitCard(visit))}
      </View>
    </View>
  );

  // No visits message
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="calendar-blank"
        size={48}
        color="#ccc"
      />
      <Text style={styles.emptyTitle}>No Scheduled Visits</Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === 'upcoming'
          ? 'You have no upcoming visits scheduled'
          : activeFilter === 'completed'
          ? 'You have no completed visits'
          : 'No visits scheduled yet'}
      </Text>
      {activeFilter === 'upcoming' && (
        <TouchableOpacity
          style={styles.scheduleButton}
          onPress={() => router.push('/doctorProfile/doctorHome')}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.scheduleButtonText}>Schedule a Visit</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const filteredVisits = getFilteredVisits();
  const filteredGrouped: GroupedVisits = {};
  Object.keys(groupedVisits).forEach((dateKey) => {
    const filtered = groupedVisits[dateKey].filter((v) =>
      activeFilter === 'all' ? true : v.status === activeFilter
    );
    if (filtered.length > 0) {
      filteredGrouped[dateKey] = filtered;
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Feather name="chevron-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scheduled Visits</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['upcoming', 'completed', 'all'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
            {activeFilter === filter && (
              <View style={styles.filterIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7d4c9e" />
          <Text style={styles.loadingText}>Loading your scheduled visits...</Text>
        </View>
      ) : filteredVisits.length === 0 ? (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderEmptyState()}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {Object.keys(filteredGrouped).map((dateKey) =>
            renderDateGroup(dateKey, filteredGrouped[dateKey])
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="notification" onTabPress={() => {}} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
    marginHorizontal: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  filterTabActive: {
    backgroundColor: '#e6d5f5',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  filterTabTextActive: {
    color: '#7d4c9e',
    fontWeight: '600',
  },
  filterIndicator: {
    height: 3,
    backgroundColor: '#7d4c9e',
    marginTop: 6,
    borderRadius: 2,
    width: '80%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  dateGroupContainer: {
    marginBottom: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    paddingVertical: 8,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  visitCountBadge: {
    backgroundColor: '#7d4c9e',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  visitCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  visitsList: {
    gap: 10,
  },
  visitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  visitCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  statusIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  patientStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  patientStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  visitType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 6,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  notesSection: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
    alignItems: 'flex-start',
  },
  notes: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  scheduleButton: {
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: '#7d4c9e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  scheduleButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
