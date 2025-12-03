import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState, useRef } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Platform,
  Vibration,
  Alert
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';

// 1. CONFIGURE NOTIFICATIONS
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// --- CUSTOM ALERT COMPONENT ---
const CustomAlert = ({ visible, title, message, type, onCancel, onConfirm, cancelText = "Cancel", confirmText = "OK" }) => {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(opacityValue, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();
    } else {
      Animated.timing(opacityValue, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => scaleValue.setValue(0));
    }
  }, [visible]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return { name: 'checkmark-circle', color: '#2ecc71' };
      case 'error': return { name: 'alert-circle', color: '#e74c3c' };
      case 'warning': return { name: 'warning', color: '#f1c40f' };
      default: return { name: 'information-circle', color: '#3498db' };
    }
  };

  const iconData = getIcon();

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.alertOverlay}>
        <Animated.View style={[styles.alertContainer, { transform: [{ scale: scaleValue }], opacity: opacityValue }]}>
          <Ionicons name={iconData.name} size={50} color={iconData.color} style={{ marginBottom: 10 }} />
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <View style={styles.alertBtnContainer}>
            {onCancel && (
              <TouchableOpacity onPress={onCancel} style={[styles.alertBtn, styles.alertBtnCancel]}>
                <Text style={styles.alertBtnTextCancel}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onConfirm} style={[styles.alertBtn, styles.alertBtnConfirm, { backgroundColor: iconData.color }]}>
              <Text style={styles.alertBtnTextConfirm}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function App() {
  // --- STATE VARIABLES ---
  const [currentTab, setCurrentTab] = useState('Home'); 
  const [balance, setBalance] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0); 
  const [transactions, setTransactions] = useState([]);
  const [scheduled, setScheduled] = useState([]); 
  
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Inputs (Home Screen)
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('expense'); 
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('💵 Cash'); 
  const [toAccount, setToAccount] = useState('🏦 Bank'); 
  const [date, setDate] = useState(new Date());
  const [isRecurring, setIsRecurring] = useState(false);

  // Inputs (Savings Screen)
  const [saveAmount, setSaveAmount] = useState('');
  const [saveGoal, setSaveGoal] = useState('');
  const [selectedSavingMode, setSelectedSavingMode] = useState('🏦 FD');
  const [savingsSource, setSavingsSource] = useState('External Money'); 
  
  // Withdraw Modal State
  const [viewingSavingsSource, setViewingSavingsSource] = useState(null); 
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawToWallet, setWithdrawToWallet] = useState('🏦 Bank');
  const [isWithdrawing, setIsWithdrawing] = useState(false); 

  // Scheduled
  const [schedAmount, setSchedAmount] = useState('');
  const [schedDesc, setSchedDesc] = useState('');
  const [schedDate, setSchedDate] = useState(new Date());
  const [showSchedPicker, setShowSchedPicker] = useState(false);
  const [schedRepeat, setSchedRepeat] = useState(false);

  // Lists
  const [categories, setCategories] = useState(['🍔 Food', '🚗 Travel', '🏠 Rent', '💰 Salary', '💳 EMI']);
  const [accounts, setAccounts] = useState(['💵 Cash', '🏦 Bank', '💳 Card']);
  const [savingsModes, setSavingsModes] = useState(['🏦 FD', '🐖 Piggy Bank', '📈 Stocks', '🚑 Emergency']);
  const [budgets, setBudgets] = useState({});

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [modalType, setModalType] = useState(''); 
  
  // Alert State
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info', onConfirm: () => {}, onCancel: null });

  // --- THEME ---
  const theme = isDarkMode ? {
    bg: '#121212', card: '#1E1E1E', text: '#E0E0E0', subText: '#AAAAAA', 
    input: '#2D2D2D', border: '#333333', modal: '#1E1E1E', placeholder: '#888',
    activeChip: '#3498db', inactiveChip: '#2D2D2D', success: '#2ecc71', danger: '#e74c3c', warning: '#f1c40f',
    navBar: '#1E1E1E', shadow: '#000'
  } : {
    bg: '#F5F7FA', card: '#FFFFFF', text: '#333333', subText: '#888888', 
    input: '#FFFFFF', border: '#DDDDDD', modal: '#FFFFFF', placeholder: '#999',
    activeChip: '#333333', inactiveChip: '#FFFFFF', success: '#2ecc71', danger: '#e74c3c', warning: '#f39c12',
    navBar: '#FFFFFF', shadow: '#ccc'
  };

  // --- UTILS ---
  const showAlert = (title, message, type = 'info', onConfirm = () => setAlertConfig(prev => ({ ...prev, visible: false })), onCancel = null) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm: () => { onConfirm(); setAlertConfig(prev => ({ ...prev, visible: false })); }, onCancel: onCancel ? () => { onCancel(); setAlertConfig(prev => ({ ...prev, visible: false })); } : null });
  };

  // --- LOAD & SAVE ---
  useEffect(() => { 
    loadData(); 
    setupNotifications(); 
  }, []);

  useEffect(() => { saveData(); }, [transactions, categories, accounts, savingsModes, budgets, isDarkMode, scheduled]);

  // --- UPDATED NOTIFICATION LOGIC ---
  const setupNotifications = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('money_manager_channel', {
        name: 'Money Manager Reminders',
        importance: Notifications.AndroidImportance.MAX, // THIS IS KEY FOR HEADS-UP NOTIFICATIONS
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus === 'granted') {
      scheduleDailyReminders();
    }
  };

  const scheduleDailyReminders = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync(); 
    
    const times = [9, 14, 20]; // 9 AM, 2 PM, 8 PM
    const messages = [
      "☕ Good Morning! Don't forget to track your expenses today.", 
      "🕑 It's Lunch Time! Did you spend any money?", 
      "🌙 Evening Review! Update your wallet before bed."
    ];

    times.forEach(async (hour, index) => {
      await Notifications.scheduleNotificationAsync({
        content: { 
          title: "Money Manager 📝", 
          body: messages[index],
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: { hour: hour, minute: 0, repeats: true },
      });
    });

    // Reschedule specific bill reminders
    scheduled.forEach(item => scheduleBillCountdown(item.description, parseDate(item.date)));
  };

  const scheduleBillCountdown = async (title, dueDateObj) => {
    const now = new Date();
    const offsets = [3, 1, 0]; // 3 days before, 1 day before, and on the day
    for (let days of offsets) {
      const triggerDate = new Date(dueDateObj);
      triggerDate.setDate(triggerDate.getDate() - days);
      triggerDate.setHours(9, 30, 0, 0); // Trigger at 9:30 AM
      
      if (triggerDate > now) {
        await Notifications.scheduleNotificationAsync({
          content: { 
            title: days === 0 ? `🚨 Bill Due Today!` : `⏳ Bill Upcoming`, 
            body: days === 0 ? `Pay your ${title} now!` : `${title} is due in ${days} days.`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX
          },
          trigger: triggerDate,
        });
      }
    }
  };

  const saveData = async () => { try { await AsyncStorage.setItem('money_manager_v20', JSON.stringify({ transactions, categories, accounts, savingsModes, budgets, isDarkMode, scheduled })); } catch (e) { console.error(e); } };

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem('money_manager_v20');
      if (stored) {
        const data = JSON.parse(stored);
        setTransactions(data.transactions || []);
        setScheduled(data.scheduled || []);
        setCategories(data.categories || ['🍔 Food', '🚗 Travel', '🏠 Rent', '💰 Salary', '💳 EMI']);
        setAccounts(data.accounts || ['💵 Cash', '🏦 Bank', '💳 Card']);
        setSavingsModes(data.savingsModes || ['🏦 FD', '🐖 Piggy Bank', '📈 Stocks', '🚑 Emergency']);
        setBudgets(data.budgets || {});
        setIsDarkMode(data.isDarkMode || false);
        calculateBalance(data.transactions || []);
      }
    } catch (e) { console.error(e); }
  };

  const parseDate = (dateString) => {
    if(!dateString) return new Date();
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day);
  };

  const calculateBalance = (data) => {
    let totBal = 0, totSave = 0;
    data.forEach(item => {
      // WALLET LOGIC
      if (item.type === 'income') totBal += item.amount;
      else if (item.type === 'expense') totBal -= item.amount;
      
      // SAVINGS LOGIC
      else if (item.type === 'saving') {
          totSave += item.amount;
          if (item.isDeducted) {
              totBal -= item.amount;
          }
      }
      // WITHDRAWAL LOGIC
      else if (item.type === 'withdraw_saving') {
          totSave -= item.amount; 
          totBal += item.amount; 
      }
    });
    setBalance(totBal);
    setTotalSaved(totSave);
    return totBal;
  };

  const getAccountBalance = (accName) => {
    return transactions.reduce((total, t) => {
        // WALLET BALANCE CALC
        if (t.account === accName) {
            if (t.type === 'income') return total + t.amount;
            if (t.type === 'expense' || t.type === 'transfer') return total - t.amount;
            if (t.type === 'saving' && t.isDeducted) return total - t.amount; // Deduct savings
        }
        // Transfers IN
        if (t.toAccount === accName && t.type === 'transfer') {
            return total + t.amount;
        }
        // Withdrawals from Savings IN
        if (t.toAccount === accName && t.type === 'withdraw_saving') {
            return total + t.amount;
        }
        return total;
    }, 0);
  };

  // --- ACTIONS ---
  const addTransaction = () => {
    if(currentTab === 'Home') {
        if (!amount || !selectedAccount) { showAlert("Missing Info", "Enter amount and select a wallet above", "error"); return; }
        const amountVal = parseFloat(amount);
        
        // Insufficient Funds Check
        if (type === 'expense' || type === 'transfer') {
            const currentBal = getAccountBalance(selectedAccount);
            if (amountVal > currentBal) {
                const deficit = amountVal - currentBal;
                showAlert("Insufficient Funds", `There is ₹${deficit} less in ${selectedAccount}.\n\nCurrent Balance: ₹${currentBal}`, "warning", () => executeTransaction(amountVal), () => {} );
                return; 
            }
        }
        executeTransaction(amountVal);

    } else if (currentTab === 'Savings') {
        if (!saveAmount || !selectedSavingMode) { showAlert("Missing Info", "Enter amount and saving mode", "error"); return; }
        if (!savingsSource) { showAlert("Missing Info", "Select Source of Funds", "error"); return; }

        const amountVal = parseFloat(saveAmount);
        const isExternal = savingsSource === 'External Money';

        // Deduct Check if NOT External
        if (!isExternal) {
             const walletBal = getAccountBalance(savingsSource);
             if (amountVal > walletBal) {
                 showAlert("Insufficient Funds", `Your ${savingsSource} only has ₹${walletBal}.`, "error");
                 return;
             }
        }

        const newTx = {
            id: Date.now().toString(), 
            amount: amountVal, 
            description: saveGoal || 'Savings Deposit',
            type: 'saving', 
            category: selectedSavingMode, 
            account: isExternal ? 'External' : savingsSource, // Source of funds
            isDeducted: !isExternal,    // Deduct only if NOT external
            date: new Date().toLocaleDateString('en-IN'), 
            isRecurring: false
        };

        const updated = [newTx, ...transactions];
        setTransactions(updated);
        calculateBalance(updated);
        setSaveAmount(''); setSaveGoal('');
        showAlert("Saved!", `₹${amountVal} added to ${selectedSavingMode}.`, "success");
    }
  };

  const withdrawSavings = () => {
      if(!withdrawAmount) return;
      const amountVal = parseFloat(withdrawAmount);
      
      const currentSavings = transactions.filter(t => t.category === viewingSavingsSource)
        .reduce((acc, t) => t.type === 'saving' ? acc + t.amount : (t.type === 'withdraw_saving' ? acc - t.amount : acc), 0);
      
      if(amountVal > currentSavings) {
          showAlert("Error", "You don't have enough savings in this source.", "error");
          return;
      }

      const newTx = {
          id: Date.now().toString(),
          amount: amountVal,
          description: `Withdrawal from ${viewingSavingsSource}`,
          type: 'withdraw_saving',
          category: viewingSavingsSource, // Source of savings
          account: 'Savings',
          toAccount: withdrawToWallet, // Target Wallet
          date: new Date().toLocaleDateString('en-IN')
      };

      const updated = [newTx, ...transactions];
      setTransactions(updated);
      calculateBalance(updated);
      setWithdrawAmount('');
      setIsWithdrawing(false);
      showAlert("Withdrawn", `₹${amountVal} moved to ${withdrawToWallet}`, "success");
    };

  const executeTransaction = (amountVal) => {
    let finalCategory = type === 'transfer' ? '🔀 Transfer' : (selectedCategory || 'Uncategorized');
    
    const newTx = {
      id: Date.now().toString(), amount: amountVal, description: description || (type === 'transfer' ? 'Transfer' : 'No Desc'),
      type, category: finalCategory, account: selectedAccount, 
      toAccount: type === 'transfer' ? toAccount : null,
      date: date.toLocaleDateString('en-IN'), isRecurring: isRecurring
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    calculateBalance(updated);
    
    if (type === 'expense' && isRecurring) {
        const nextDueDate = new Date(date); nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        const newScheduleItem = { id: Date.now().toString() + '_auto', amount: amountVal, description: description || 'Recurring', date: nextDueDate.toLocaleDateString('en-IN'), repeat: true };
        setScheduled([...scheduled, newScheduleItem]);
    }
    setAmount(''); setDescription(''); setIsRecurring(false); setDate(new Date()); 
    showAlert("Success", "Transaction added successfully!", "success");
  };

  const deleteTransaction = (id) => {
    showAlert("Delete Transaction", "Are you sure you want to remove this?", "warning", () => {
          const updated = transactions.filter(t => t.id !== id);
          setTransactions(updated); calculateBalance(updated);
    }, () => {});
  };

  const deleteAccount = (accName) => {
      showAlert("Delete Wallet", `Remove "${accName}" and all its history?`, "error", () => {
             const newAccs = accounts.filter(a => a !== accName);
             setAccounts(newAccs);
             if(selectedAccount === accName) setSelectedAccount(newAccs[0] || '');
      }, () => {});
  };

  const deleteCategory = (catName) => {
      showAlert("Delete Category", `Remove "${catName}"?`, "warning", () => {
             const newCats = categories.filter(c => c !== catName);
             setCategories(newCats);
             if(selectedCategory === catName) setSelectedCategory(newCats[0] || '');
      }, () => {});
  };

  const deleteSavingsMode = (modeName) => {
      showAlert("Delete Savings Goal", `Remove "${modeName}"?`, "error", () => {
             const newModes = savingsModes.filter(m => m !== modeName);
             setSavingsModes(newModes);
             if(selectedSavingMode === modeName) setSelectedSavingMode(newModes[0] || '');
      }, () => {});
  };

  // --- HELPER RENDERS ---
  const addScheduled = () => {
    if(!schedAmount || !schedDesc) return;
    const newItem = { id: Date.now().toString(), amount: parseFloat(schedAmount), description: schedDesc, date: schedDate.toLocaleDateString('en-IN'), repeat: schedRepeat };
    setScheduled([...scheduled, newItem]);
    scheduleBillCountdown(schedDesc, schedDate);
    setSchedAmount(''); setSchedDesc(''); setSchedRepeat(false);
  };

  const payScheduled = (item) => {
    const newTx = { id: Date.now().toString(), amount: item.amount, description: item.description, type: 'expense', category: '📅 Bill', account: '🏦 Bank', date: new Date().toLocaleDateString('en-IN'), isRecurring: false };
    const updatedTx = [newTx, ...transactions];
    setTransactions(updatedTx);
    calculateBalance(updatedTx);
    if (item.repeat) {
      const oldDate = parseDate(item.date);
      const nextDate = new Date(oldDate.setMonth(oldDate.getMonth() + 1));
      setScheduled(scheduled.map(s => s.id === item.id ? { ...s, date: nextDate.toLocaleDateString('en-IN') } : s));
    } else {
      setScheduled(scheduled.filter(s => s.id !== item.id));
    }
  };

  const deleteScheduled = (id) => setScheduled(scheduled.filter(s => s.id !== id));
  
  const openModal = (t) => { setModalType(t); setNewItemText(''); setModalVisible(true); };
  const saveNewItem = () => {
    if (!newItemText.trim()) { setModalVisible(false); return; }
    if (modalType === 'category' && !categories.includes(newItemText)) setCategories([...categories, newItemText]);
    if (modalType === 'account' && !accounts.includes(newItemText)) setAccounts([...accounts, newItemText]);
    if (modalType === 'savingMode' && !savingsModes.includes(newItemText)) setSavingsModes([...savingsModes, newItemText]);
    setModalVisible(false);
  };

  const getCategorySpendingThisMonth = (cat) => {
    const now = new Date();
    return transactions.reduce((acc, t) => {
      const tDate = parseDate(t.date);
      if (t.type === 'expense' && t.category === cat && tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()) return acc + t.amount;
      return acc;
    }, 0);
  };

  // --- SCREENS ---
  const renderHomeScreen = () => (
    <ScrollView contentContainerStyle={{paddingBottom: 100}} showsVerticalScrollIndicator={false}>
       <View style={[styles.netWorthCard, {backgroundColor: theme.card}]}>
          <Text style={{color: theme.subText, fontSize: 14}}>Total Wallet Balance</Text>
          <Text style={{fontSize: 36, fontWeight: 'bold', color: balance >= 0 ? theme.success : theme.danger, marginVertical: 5}}>₹{balance.toFixed(2)}</Text>
          <Text style={{color: theme.subText, fontSize: 10}}>(Excludes Savings)</Text>
       </View>

       <Text style={{marginLeft: 20, marginBottom: 5, fontWeight: 'bold', color: theme.subText}}>Select Source Wallet</Text>
       <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 15}}>
           {accounts.map(acc => {
               const accBal = getAccountBalance(acc);
               const isSelected = selectedAccount === acc;
               return (
                   <TouchableOpacity 
                    onPress={() => setSelectedAccount(acc)}
                    onLongPress={() => deleteAccount(acc)} 
                    key={acc} 
                    style={{
                        backgroundColor: theme.card, 
                        padding: 15, 
                        borderRadius: 15, 
                        marginRight: 15, 
                        minWidth: 120, 
                        elevation: isSelected ? 8 : 2,
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: '#3498db'
                    }}>
                       <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                          <Text style={{fontSize: 20, marginBottom: 5}}>{acc.split(' ')[0]}</Text>
                          {isSelected && <Ionicons name="checkmark-circle" size={16} color="#3498db" />}
                       </View>
                       <Text style={{color: theme.subText, fontSize: 12}}>{acc.split(' ').slice(1).join(' ') || acc}</Text>
                       <Text style={{fontWeight: 'bold', fontSize: 16, color: theme.text, marginTop: 5}}>₹{accBal}</Text>
                   </TouchableOpacity>
               )
           })}
           <TouchableOpacity onPress={() => openModal('account')} style={{backgroundColor: theme.input, padding: 15, borderRadius: 15, justifyContent: 'center', alignItems: 'center', width: 60}}>
               <Text style={{fontSize: 24, color: theme.subText}}>+</Text>
           </TouchableOpacity>
       </ScrollView>

       <View style={[styles.form, {backgroundColor: theme.bg}]}>
        <View style={[styles.toggleContainer, { backgroundColor: isDarkMode ? '#2D2D2D' : '#E0E6ED' }]}>
          {['income', 'expense', 'transfer'].map(t => (
            <TouchableOpacity key={t} style={[styles.toggleBtn, type===t && (t==='income'?styles.activeIncome:t==='expense'?styles.activeExpense:styles.activeTransfer)]} onPress={()=>setType(t)}>
              <Text style={[styles.toggleText, {color: type===t ? 'white' : theme.subText, textTransform:'capitalize'}]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1, marginRight: 10, backgroundColor: theme.input, color: theme.text }]} placeholder="Amount" placeholderTextColor={theme.placeholder} keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <TextInput style={[styles.input, { flex: 2, backgroundColor: theme.input, color: theme.text }]} placeholder={type==='transfer'?"Note":"Description"} placeholderTextColor={theme.placeholder} value={description} onChangeText={setDescription} />
        </View>

        <Text style={{marginLeft: 5, marginBottom: 10, fontSize: 12, fontWeight:'bold', color: theme.subText}}>
            {type === 'income' ? 'Depositing To: ' : (type === 'expense' ? 'Paying From: ' : 'Transferring From: ')} 
            <Text style={{color: '#3498db'}}>{selectedAccount}</Text>
        </Text>

        {type === 'transfer' ? (
            <>
            <Text style={{marginLeft: 5, marginBottom: 5, fontSize: 12, fontWeight:'bold', color: theme.subText}}>Transfer To:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15}}>
                {accounts.map(acc => (
                    <TouchableOpacity key={acc} onPress={()=>setToAccount(acc)} style={[styles.chip, {backgroundColor: toAccount===acc?theme.activeChip:theme.input, borderColor: theme.border}]}>
                        <Text style={{color: toAccount===acc?'white':theme.subText}}>{acc}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            </>
        ) : (
            <>
            <Text style={{marginLeft: 5, marginBottom: 5, fontSize: 12, fontWeight:'bold', color: theme.subText}}>Category:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15}}>
                {categories.map(cat => (
                    <TouchableOpacity key={cat} onPress={()=>setSelectedCategory(cat)} onLongPress={()=>deleteCategory(cat)} style={[styles.chip, {backgroundColor: selectedCategory===cat?theme.activeChip:theme.input, borderColor: theme.border}]}>
                        <Text style={{color: selectedCategory===cat?'white':theme.subText}}>{cat}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => openModal('category')} style={[styles.chip, styles.addChip]}><Text style={styles.addChipText}>+</Text></TouchableOpacity>
            </ScrollView>
            </>
        )}
        
        <TouchableOpacity style={[styles.addBtn, {backgroundColor: type==='transfer'?'#3498db':'#333'}]} onPress={addTransaction}><Text style={styles.addBtnText}>Save Transaction</Text></TouchableOpacity>
       </View>

       <Text style={{marginLeft: 20, marginBottom: 10, fontWeight: 'bold', color: theme.subText}}>Recent Transactions (Last 5)</Text>
       {transactions.slice(0, 5).map((item) => (
          <TouchableOpacity key={item.id} onLongPress={() => deleteTransaction(item.id)}>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={{flex: 1}}>
                <Text style={[styles.cardDesc, { color: theme.text }]}>{item.description}</Text>
                <Text style={[styles.cardSub, { color: theme.subText }]}>{item.date} • {item.category} • {item.account}</Text>
              </View>
              <Text style={[styles.cardAmount, { color: item.type === 'income' ? theme.success : item.type === 'expense' ? theme.danger : theme.warning }]}>
                {item.type==='income'?'+':item.type==='expense'?'-':''} ₹{item.amount}
              </Text>
            </View>
          </TouchableOpacity>
       ))}
    </ScrollView>
  );

  const renderHistoryScreen = () => (
      <ScrollView contentContainerStyle={{paddingBottom: 100}} showsVerticalScrollIndicator={false}>
          <Text style={{fontSize: 24, fontWeight: 'bold', color: theme.text, margin: 20}}>All Transactions History</Text>
          {transactions.length === 0 ? <Text style={{textAlign:'center', color: theme.subText, marginTop: 50}}>No History Yet</Text> : 
           transactions.map((item) => (
              <TouchableOpacity key={item.id} onLongPress={() => deleteTransaction(item.id)}>
                <View style={[styles.card, { backgroundColor: theme.card, marginHorizontal: 20 }]}>
                  <View style={{flex: 1}}>
                    <Text style={[styles.cardDesc, { color: theme.text }]}>{item.description} {item.isDeducted && ' (From Wallet)'}</Text>
                    <Text style={[styles.cardSub, { color: theme.subText }]}>{item.date} • {item.category} • {item.account}</Text>
                  </View>
                  <Text style={[styles.cardAmount, { color: item.type === 'income' ? theme.success : item.type === 'expense' ? theme.danger : theme.warning }]}>
                    {item.type==='income'||item.type==='withdraw_saving'?'+':item.type==='expense'?'-':''} ₹{item.amount}
                  </Text>
                </View>
              </TouchableOpacity>
           ))}
      </ScrollView>
  );

  const renderSavingsScreen = () => {
    const savingsTx = transactions.filter(t => t.type === 'saving');
    return (
      <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 100}}>
        <View style={{alignItems: 'center', marginBottom: 20}}>
           <Ionicons name="piggy-bank" size={60} color={theme.warning} />
           <Text style={{fontSize: 24, fontWeight: 'bold', color: theme.text, marginTop: 10}}>Total Saved</Text>
           <Text style={{fontSize: 40, fontWeight: 'bold', color: theme.warning}}>₹{totalSaved}</Text>
        </View>

        <View style={{backgroundColor: theme.card, padding: 15, borderRadius: 15, marginBottom: 20, elevation: 2}}>
            <Text style={{color: theme.subText, marginBottom: 10, fontWeight:'bold'}}>Add New Savings</Text>
            <View style={{flexDirection: 'row', marginBottom: 10}}>
                <TextInput style={[styles.input, {flex:1, marginRight:10, backgroundColor: theme.input, color: theme.text}]} placeholder="₹ Amount" placeholderTextColor={theme.placeholder} keyboardType="numeric" value={saveAmount} onChangeText={setSaveAmount} />
                <TextInput style={[styles.input, {flex:2, backgroundColor: theme.input, color: theme.text}]} placeholder="Goal (e.g. New Car)" placeholderTextColor={theme.placeholder} value={saveGoal} onChangeText={setSaveGoal} />
            </View>
            
            {/* SAVINGS MODE SELECTOR */}
            <Text style={{color: theme.subText, fontSize: 12, marginBottom: 5}}>Select Saving Mode:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 10}}>
                {savingsModes.map(item => (
                    <TouchableOpacity 
                        key={item} 
                        onPress={()=>setSelectedSavingMode(item)} 
                        onLongPress={()=>deleteSavingsMode(item)}
                        style={[styles.chip, {backgroundColor: selectedSavingMode===item?theme.warning:theme.input, borderColor: theme.border}]}>
                        <Text style={{color: selectedSavingMode===item?'white':theme.subText}}>{item}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => openModal('savingMode')} style={[styles.chip, styles.addChip]}><Text style={styles.addChipText}>+</Text></TouchableOpacity>
            </ScrollView>

            {/* SOURCE OF FUNDS SELECTOR (UPDATED) */}
            <Text style={{color: theme.subText, fontSize: 12, marginBottom: 5}}>Source of Funds:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
                {/* External Money Option */}
                <TouchableOpacity 
                    onPress={() => setSavingsSource('External Money')}
                    style={[styles.chip, {backgroundColor: savingsSource==='External Money' ? theme.activeChip : theme.input, borderColor: theme.border}]}>
                    <Text style={{color: savingsSource==='External Money'?'white':theme.subText}}>External Money</Text>
                </TouchableOpacity>

                {/* Wallets */}
                {accounts.map(acc => (
                    <TouchableOpacity 
                        key={acc} 
                        onPress={() => setSavingsSource(acc)} 
                        style={[styles.chip, {backgroundColor: savingsSource===acc ? theme.activeChip : theme.input, borderColor: theme.border}]}>
                        <Text style={{color: savingsSource===acc?'white':theme.subText}}>{acc}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity onPress={addTransaction} style={{backgroundColor: theme.warning, padding:10, borderRadius:8, alignItems:'center'}}><Text style={{color:'white', fontWeight:'bold'}}>Deposit to Savings</Text></TouchableOpacity>
        </View>

        <Text style={{fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 15}}>Savings Breakdown</Text>
        {savingsModes.map(mode => {
            const total = transactions.filter(t => t.category === mode).reduce((acc, t) => t.type === 'saving' ? acc + t.amount : (t.type === 'withdraw_saving' ? acc - t.amount : acc), 0);
            return (
                <TouchableOpacity key={mode} onPress={() => setViewingSavingsSource(mode)}>
                    <View style={[styles.card, {backgroundColor: theme.card}]}>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                        <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: theme.bg, justifyContent:'center', alignItems:'center', marginRight: 15}}>
                            <Text>💰</Text>
                        </View>
                        <View>
                            <Text style={{fontSize: 16, fontWeight: 'bold', color: theme.text}}>{mode}</Text>
                            <Text style={{color: theme.subText}}>{transactions.filter(t=>t.category===mode && t.type==='saving').length} deposits</Text>
                        </View>
                    </View>
                    <Text style={{fontSize: 18, fontWeight: 'bold', color: theme.success}}>₹{total}</Text>
                    </View>
                </TouchableOpacity>
            )
        })}
      </ScrollView>
    )
  };

  const renderBillsScreen = () => (
    <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 100}}>
        <Text style={{fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 20}}>Upcoming Bills</Text>
        <View style={{backgroundColor: theme.card, padding: 15, borderRadius: 15, marginBottom: 20, elevation: 2}}>
            <Text style={{color: theme.subText, marginBottom: 10, fontWeight:'bold'}}>Add New Reminder</Text>
            <View style={{flexDirection: 'row', marginBottom: 10}}>
                <TextInput style={[styles.input, {flex:1, marginRight:10, backgroundColor: theme.input, color: theme.text}]} placeholder="₹" placeholderTextColor={theme.placeholder} keyboardType="numeric" value={schedAmount} onChangeText={setSchedAmount} />
                <TextInput style={[styles.input, {flex:2, backgroundColor: theme.input, color: theme.text}]} placeholder="Desc" placeholderTextColor={theme.placeholder} value={schedDesc} onChangeText={setSchedDesc} />
            </View>
            <View style={{flexDirection: 'row', justifyContent:'space-between', alignItems:'center'}}>
                <TouchableOpacity onPress={() => setShowSchedPicker(true)} style={[styles.dateBtn, {backgroundColor: theme.input, borderColor: theme.border}]}><Text style={{color:theme.text}}>{schedDate.toLocaleDateString('en-IN')}</Text></TouchableOpacity>
                <TouchableOpacity onPress={addScheduled} style={{backgroundColor: '#3498db', padding:10, borderRadius:8}}><Text style={{color:'white', fontWeight:'bold'}}>Add Bill</Text></TouchableOpacity>
            </View>
            {showSchedPicker && (<DateTimePicker value={schedDate} mode="date" onChange={(e,d) => { setShowSchedPicker(false); if(d) setSchedDate(d); }} />)}
        </View>

        {scheduled.length === 0 ? <Text style={{color: theme.subText, textAlign: 'center'}}>No bills scheduled. You're free!</Text> :
        scheduled.sort((a,b) => parseDate(a.date) - parseDate(b.date)).map((item) => (
            <View key={item.id} style={[styles.card, {backgroundColor: theme.card, flexDirection: 'column', alignItems: 'flex-start'}]}>
                <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom: 10}}>
                   <View>
                        <Text style={{fontSize: 18, fontWeight:'bold', color: theme.text}}>{item.description}</Text>
                        <Text style={{color: theme.danger, fontWeight:'bold'}}>Due: {item.date}</Text>
                   </View>
                   <Text style={{fontSize: 20, fontWeight:'bold', color: theme.text}}>₹{item.amount}</Text>
                </View>
                <View style={{flexDirection: 'row', justifyContent: 'flex-end', width: '100%'}}>
                   <TouchableOpacity onPress={() => payScheduled(item)} style={{backgroundColor: theme.success, paddingHorizontal:15, paddingVertical:8, borderRadius:20, marginRight:10}}><Text style={{color:'white', fontWeight:'bold'}}>Pay Now</Text></TouchableOpacity>
                   <TouchableOpacity onPress={() => deleteScheduled(item.id)} style={{backgroundColor: theme.input, paddingHorizontal:15, paddingVertical:8, borderRadius:20}}><Text style={{color: theme.danger}}>Delete</Text></TouchableOpacity>
                </View>
            </View>
        ))}
    </ScrollView>
  );

  const renderBudgetScreen = () => (
    <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 100}}>
        <Text style={{fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 20}}>Monthly Budget</Text>
        {categories.map((cat) => {
            const spent = getCategorySpendingThisMonth(cat);
            const limit = budgets[cat] || 0;
            const percent = limit > 0 ? (spent / limit) * 100 : 0;
            return (
            <View key={cat} style={{marginBottom: 20, backgroundColor: theme.card, padding: 15, borderRadius: 15}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5}}>
                <Text style={{fontSize: 16, fontWeight: '600', color: theme.text}}>{cat}</Text>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={{color: theme.subText, marginRight: 5}}>Max: ₹</Text>
                    <TextInput placeholder="0" placeholderTextColor={theme.placeholder} keyboardType="numeric" style={{borderBottomWidth: 1, borderColor: theme.border, width: 60, textAlign: 'right', color: theme.text}} defaultValue={limit > 0 ? limit.toString() : ''} onEndEditing={(e) => setBudgets({...budgets, [cat]: parseFloat(e.nativeEvent.text) || 0})} />
                </View>
                </View>
                <View style={{height: 12, backgroundColor: theme.bg, borderRadius: 6, overflow: 'hidden', marginVertical: 8}}>
                <View style={{height: 12, width: `${Math.min(percent, 100)}%`, backgroundColor: percent > 100 ? theme.danger : percent > 80 ? '#f1c40f' : theme.success}} />
                </View>
                <Text style={{fontSize: 12, color: theme.subText}}>Spent: ₹{spent} / ₹{limit}</Text>
            </View>
            )
        })}
    </ScrollView>
  );

  const renderReportScreen = () => {
    const pieData = Object.keys(transactions.filter(t=>t.type==='expense').reduce((acc, t) => { acc[t.category] = (acc[t.category]||0) + t.amount; return acc; }, {}))
      .map((key, i) => ({ name: key, population: transactions.filter(t=>t.type==='expense'&&t.category===key).reduce((a,b)=>a+b.amount,0), color: ['#e74c3c', '#3498db', '#9b59b6', '#2ecc71', '#f1c40f'][i%5], legendFontColor: theme.subText, legendFontSize: 12 }));
    
    return (
        <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 100}}>
            <Text style={{fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 20}}>Analytics</Text>
            <View style={{alignItems: 'center', backgroundColor: theme.card, borderRadius: 15, padding: 10}}>
                <PieChart data={pieData} width={Dimensions.get("window").width - 60} height={220} chartConfig={{ color: (opacity = 1) => theme.text }} accessor={"population"} backgroundColor={"transparent"} paddingLeft={"15"} absolute />
            </View>
        </ScrollView>
    );
  }

  const TabButton = ({ name, icon, isHome, onPress, active }) => {
    const scale = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.spring(scale, { toValue: active ? 1.2 : 1, friction: 5, useNativeDriver: true }).start();
    }, [active]);

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{alignItems: 'center', justifyContent: 'center', top: isHome ? -20 : 0}}>
             <Animated.View style={{
                 transform: [{scale}],
                 backgroundColor: isHome ? '#333' : 'transparent',
                 width: isHome ? 60 : 'auto', height: isHome ? 60 : 'auto',
                 borderRadius: 30, justifyContent: 'center', alignItems: 'center',
                 shadowColor: isHome ? "#000" : "transparent", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: isHome ? 8 : 0
             }}>
                 <Ionicons name={icon} size={isHome ? 28 : 24} color={isHome ? 'white' : (active ? '#333' : '#999')} />
             </Animated.View>
             {!isHome && <Text style={{fontSize: 10, marginTop: 4, color: active ? '#333' : '#999', fontWeight: active?'bold':'normal'}}>{name}</Text>}
        </TouchableOpacity>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'History': return renderHistoryScreen(); // NEW SCREEN
      case 'Savings': return renderSavingsScreen();
      case 'Budget': return renderBudgetScreen();
      case 'Bills': return renderBillsScreen();
      case 'Report': return renderReportScreen();
      case 'Home': default: return renderHomeScreen();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View style={[styles.header, { backgroundColor: theme.bg }]}>
         <View style={{flexDirection: 'row', alignItems: 'center'}}>
             <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: theme.card, marginRight: 10, justifyContent: 'center', alignItems: 'center'}}><Text style={{fontSize: 20}}>👋</Text></View>
             <View>
                 <Text style={{color: theme.subText, fontSize: 12}}>Welcome Back</Text>
                 <Text style={{color: theme.text, fontSize: 16, fontWeight: 'bold'}}>{currentTab}</Text>
             </View>
         </View>
         <View style={{flexDirection: 'row'}}>
            {/* NEW HISTORY BUTTON */}
             <TouchableOpacity style={[styles.iconBtn, {backgroundColor: theme.card, marginRight: 10}]} onPress={() => setCurrentTab('History')}>
                <Ionicons name="receipt-outline" size={18} color={theme.text} />
             </TouchableOpacity>
             <TouchableOpacity style={[styles.iconBtn, {backgroundColor: theme.card}]} onPress={() => setIsDarkMode(!isDarkMode)}>
                <Text style={{fontSize: 18}}>{isDarkMode ? '🌙' : '☀️'}</Text>
             </TouchableOpacity>
         </View>
      </View>
      <View style={{flex: 1}}>{renderContent()}</View>
      <View style={[styles.navBar, {backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff', shadowColor: theme.shadow}]}>
         <TabButton name="Savings" icon="wallet-outline" active={currentTab==='Savings'} onPress={()=>setCurrentTab('Savings')} />
         <TabButton name="Budget" icon="pie-chart-outline" active={currentTab==='Budget'} onPress={()=>setCurrentTab('Budget')} />
         <TabButton name="Home" icon="add" isHome active={currentTab==='Home'} onPress={()=>setCurrentTab('Home')} />
         <TabButton name="Bills" icon="calendar-outline" active={currentTab==='Bills'} onPress={()=>setCurrentTab('Bills')} />
         <TabButton name="Report" icon="bar-chart-outline" active={currentTab==='Report'} onPress={()=>setCurrentTab('Report')} />
      </View>
      
      {/* UNIVERSAL INPUT MODAL */}
      <Modal transparent={true} visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.modal }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>New {modalType}</Text>
            <TextInput style={[styles.modalInput, { borderColor: theme.border, color: theme.text }]} placeholder="Name" placeholderTextColor={theme.placeholder} value={newItemText} onChangeText={setNewItemText} autoFocus={true} />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalBtnCancel}><Text style={{color: theme.subText}}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveNewItem} style={styles.modalBtnSave}><Text style={{color:'white'}}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CUSTOM ANIMATED ALERT COMPONENT */}
      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        confirmText={alertConfig.type === 'warning' ? 'Proceed' : 'OK'}
      />

      {/* SAVINGS DETAILS & WITHDRAWAL MODAL */}
      <Modal visible={!!viewingSavingsSource} animationType="slide" presentationStyle="pageSheet">
        <View style={{flex: 1, backgroundColor: theme.bg, padding: 20}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
                <Text style={{fontSize: 24, fontWeight: 'bold', color: theme.text}}>{viewingSavingsSource}</Text>
                <TouchableOpacity onPress={() => { setViewingSavingsSource(null); setIsWithdrawing(false); }} style={{backgroundColor: theme.card, padding: 8, borderRadius: 20}}>
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            {/* TOGGLE: HISTORY OR WITHDRAW */}
            <View style={{flexDirection: 'row', marginBottom: 20, backgroundColor: theme.card, borderRadius: 10, padding: 4}}>
                <TouchableOpacity onPress={() => setIsWithdrawing(false)} style={{flex: 1, padding: 10, alignItems: 'center', backgroundColor: !isWithdrawing ? theme.activeChip : 'transparent', borderRadius: 8}}>
                    <Text style={{fontWeight: 'bold', color: !isWithdrawing ? 'white' : theme.subText}}>History</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsWithdrawing(true)} style={{flex: 1, padding: 10, alignItems: 'center', backgroundColor: isWithdrawing ? theme.activeChip : 'transparent', borderRadius: 8}}>
                    <Text style={{fontWeight: 'bold', color: isWithdrawing ? 'white' : theme.subText}}>Withdraw</Text>
                </TouchableOpacity>
            </View>

            {isWithdrawing ? (
                <View>
                    <Text style={{color: theme.text, fontSize: 18, marginBottom: 10}}>Withdraw to Wallet</Text>
                    <TextInput style={[styles.input, { backgroundColor: theme.input, color: theme.text, marginBottom: 20 }]} placeholder="Amount" placeholderTextColor={theme.placeholder} keyboardType="numeric" value={withdrawAmount} onChangeText={setWithdrawAmount} />
                    
                    <Text style={{color: theme.subText, marginBottom: 10}}>Deposit to:</Text>
                    <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                        {accounts.map(acc => (
                            <TouchableOpacity key={acc} onPress={() => setWithdrawToWallet(acc)} style={[styles.chip, {backgroundColor: withdrawToWallet===acc ? theme.activeChip : theme.card, marginBottom: 10}]}>
                                <Text style={{color: withdrawToWallet===acc ? 'white' : theme.text}}>{acc}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity onPress={withdrawSavings} style={{backgroundColor: theme.warning, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20}}>
                        <Text style={{color: 'white', fontWeight: 'bold', fontSize: 16}}>Confirm Withdrawal</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList 
                    data={transactions.filter(t => t.category === viewingSavingsSource && (t.type === 'saving' || t.type === 'withdraw_saving'))}
                    keyExtractor={item => item.id}
                    renderItem={({item}) => (
                        <View style={[styles.card, {backgroundColor: theme.card}]}>
                            <View>
                                <Text style={{fontSize: 16, color: theme.text, fontWeight: 'bold'}}>{item.type === 'withdraw_saving' ? 'Withdrawal' : 'Deposit'}</Text>
                                <Text style={{color: theme.subText}}>{item.date}</Text>
                            </View>
                            <Text style={{fontSize: 16, fontWeight: 'bold', color: item.type === 'saving' ? theme.success : theme.danger}}>
                                {item.type === 'saving' ? '+' : '-'} ₹{item.amount}
                            </Text>
                        </View>
                    )}
                />
            )}
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { padding: 10, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  netWorthCard: { marginHorizontal: 20, marginTop: 10, marginBottom: 20, padding: 20, borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.1, shadowRadius: 4 },
  form: { paddingHorizontal: 20, marginBottom: 20 },
  toggleContainer: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 15 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeIncome: { backgroundColor: '#2ecc71' }, activeExpense: { backgroundColor: '#e74c3c' }, activeTransfer: { backgroundColor: '#3498db' }, activeSaving: { backgroundColor: '#f1c40f' },
  toggleText: { fontWeight: '600', fontSize: 12 },
  row: { flexDirection: 'row', marginBottom: 15 },
  input: { padding: 12, borderRadius: 12, fontSize: 16, elevation: 1 },
  chip: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  addChip: { backgroundColor: '#E8F0FE', borderColor: '#DAE5F5' }, addChipText: { color: '#2b7de9', fontWeight: 'bold' },
  addBtn: { padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 10 }, addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: { flexDirection: 'row', marginBottom: 12, padding: 15, borderRadius: 16, alignItems: 'center', elevation: 2 },
  cardDesc: { fontSize: 16, fontWeight: '600' }, cardSub: { fontSize: 12, marginTop: 2 }, cardAmount: { fontSize: 16, fontWeight: 'bold' },
  navBar: { position: 'absolute', bottom: 25, left: 20, right: 20, borderRadius: 35, height: 70, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, elevation: 10, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', padding: 20, borderRadius: 20, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 16, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtnCancel: { flex: 1, alignItems: 'center', padding: 10 },
  modalBtnSave: { flex: 1, alignItems: 'center', backgroundColor: '#333', borderRadius: 10, padding: 10, marginLeft: 10 },
  dateBtn: { padding: 10, borderRadius: 8, borderWidth: 1 },
  // Alert Styles
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  alertContainer: { width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10 },
  alertTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 10, textAlign: 'center' },
  alertMessage: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 20 },
  alertBtnContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  alertBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  alertBtnCancel: { backgroundColor: '#f0f0f0' },
  alertBtnConfirm: { backgroundColor: '#3498db' },
  alertBtnTextCancel: { color: '#888', fontWeight: 'bold' },
  alertBtnTextConfirm: { color: 'white', fontWeight: 'bold' },
});