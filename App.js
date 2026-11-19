import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator, Avatar, Badge, Button, Card, Chip, Divider, HelperText,
    MD3DarkTheme,
    PaperProvider,
    RadioButton, Searchbar, SegmentedButtons, Text, TextInput
} from 'react-native-paper';
import { auth, db } from './firebaseConfig';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const TEAL = '#009688';
const DARK_THEME = {...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: TEAL,
    background: '#121212',
    surface: '#1E1E1E',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
    },
  },
};
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const TIMES = ['10:00 AM','11:00 AM','12:00 PM','5:00 PM','6:00 PM'];
const FILTERS = ['All','General Physician','Cardiologist','Dermatologist','Pediatrician','Orthopedic','Dentist'];
const TODAY = () => new Date().toISOString().slice(0,10);
const DATE = s => s ? new Date(`${s}T00:00:00`).toLocaleDateString() : '';
const err = e => e?.message || 'Something went wrong';
const SAMPLE_DOCTORS = [
 {id:'demo1',name:'Dr. Ananya Naik',speciality:'General Physician',experience:'8 years',fees:500,location:'Panaji, Goa',rating:4.8,about:'Family physician providing general consultations and preventive care.'},
 {id:'demo2',name:'Dr. Rohan Dessai',speciality:'Cardiologist',experience:'12 years',fees:900,location:'Margao, Goa',rating:4.9,about:'Heart health and cardiac risk assessment.'},
 {id:'demo3',name:'Dr. Meera Kamat',speciality:'Dermatologist',experience:'7 years',fees:700,location:'Mapusa, Goa',rating:4.7,about:'Skin, hair and nail consultations.'},
 {id:'demo4',name:'Dr. Arjun Rao',speciality:'Pediatrician',experience:'10 years',fees:600,location:'Vasco, Goa',rating:4.8,about:'Child health and routine pediatric care.'},
 {id:'demo5',name:'Dr. Sara Fernandes',speciality:'Orthopedic',experience:'9 years',fees:800,location:'Ponda, Goa',rating:4.6,about:'Bone, joint and muscle consultations.'},
 {id:'demo6',name:"Dr. Neil D'Souza",speciality:'Dentist',experience:'6 years',fees:400,location:'Margao, Goa',rating:4.7,about:'General dental and preventive oral care.'}
];

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FA' },
  pad: { padding: 16, paddingBottom: 32 },
  form: { padding: 22, paddingBottom: 40 },

  title: { fontWeight: 'bold', color: '#212121' },
  sub: { color: '#424242', marginTop: 5 },
  field: { marginTop: 12, backgroundColor: '#FFFFFF' },
  label: {
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 15,
    marginBottom: 6,
  },

  button: { marginTop: 16, backgroundColor: TEAL, borderRadius: 8 },
  card: { marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 12 },

  muted: { color: '#424242', marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center' },
  space: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  empty: {
    textAlign: 'center',
    padding: 24,
    color: '#424242',
  },
  search: { marginVertical: 12, backgroundColor: '#FFFFFF' },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FA',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,.45)',
    justifyContent: 'center',
    padding: 16,
  },
});
function Field(p) {
  return (
    <TextInput
      {...p}
      mode="outlined"
      textColor="#212121"
      placeholderTextColor="#757575"
      outlineColor="#9E9E9E"
      activeOutlineColor={TEAL}
      style={[styles.field, p.style]}
      theme={{
        colors: {
          onSurface: '#212121',
          onSurfaceVariant: '#424242',
          placeholder: '#757575',
        },
      }}
    />
  );
}function Empty({text='No data found'}){return <Text style={styles.empty}>{text}</Text>}
function Loading(){return <ActivityIndicator color={TEAL} style={{margin:24}}/>}
function Section({children}){return <Text variant="titleLarge" style={[styles.title,{marginTop:18,marginBottom:10}]}>{children}</Text>}
function Splash(){return <View style={styles.splash}><Avatar.Icon size={105} icon="medical-bag" color={TEAL} style={{backgroundColor:'#E0F2F1'}}/><Text variant="displaySmall" style={{color:TEAL,fontWeight:'bold',marginTop:16}}>MediCare</Text><Text style={styles.sub}>Your Health, Our Care</Text></View>}

function Register({navigation}){
 const [f,S]=useState({name:'',email:'',password:'',confirm:'',gender:'Other',dob:'',phone:'',address:'',bloodGroup:'O+'}); const [busy,B]=useState(false); const set=(k,v)=>S(p=>({...p,[k]:v}));
 async function submit(){if(['name','email','password','confirm','dob','phone','address'].some(k=>!String(f[k]).trim()))return Alert.alert('Missing details','Please complete all fields.');if(f.password.length<6)return Alert.alert('Password','Use at least 6 characters.');if(f.password!==f.confirm)return Alert.alert('Password','Passwords do not match.');B(true);try{const c=await createUserWithEmailAndPassword(auth,f.email.trim(),f.password);await setDoc(doc(db,'users',c.user.uid),{name:f.name.trim(),email:f.email.trim(),gender:f.gender,dob:f.dob.trim(),phone:f.phone.trim(),address:f.address.trim(),bloodGroup:f.bloodGroup,createdAt:serverTimestamp()});Alert.alert('Success','Your MediCare account has been created.')}catch(e){Alert.alert('Registration failed',err(e))}finally{B(false)}}
 return <View style={styles.screen}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView contentContainerStyle={styles.form}><Text variant="headlineMedium" style={{color:TEAL,fontWeight:'bold'}}>Create Account</Text><Text style={styles.sub}>Join MediCare to book doctors & manage medicines</Text>
 <Field label="Full Name" value={f.name} onChangeText={v=>set('name',v)}/><Field label="Email" value={f.email} onChangeText={v=>set('email',v)} autoCapitalize="none" keyboardType="email-address"/><Field label="Password" value={f.password} onChangeText={v=>set('password',v)} secureTextEntry/><Field label="Confirm Password" value={f.confirm} onChangeText={v=>set('confirm',v)} secureTextEntry/>
 <Text style={styles.label}>Gender</Text><RadioButton.Group value={f.gender} onValueChange={v=>set('gender',v)}><View style={styles.row}>{['Male','Female','Other'].map(x=><RadioButton.Item key={x} label={x} value={x} position="leading"/> )}</View></RadioButton.Group>
 <Field label="Date of Birth (DD/MM/YYYY)" value={f.dob} onChangeText={v=>set('dob',v)} placeholder="DD/MM/YYYY"/><Field label="Phone Number" value={f.phone} onChangeText={v=>set('phone',v)} keyboardType="phone-pad"/><Field label="Address" value={f.address} onChangeText={v=>set('address',v)} multiline numberOfLines={3}/>
 <Text style={styles.label}>Blood Group</Text><View style={styles.chips}>{['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(x=><Chip key={x} selected={f.bloodGroup===x} onPress={()=>set('bloodGroup',x)}>{x}</Chip>)}</View>
 <Button mode="contained" loading={busy} disabled={busy} onPress={submit} style={styles.button}>Create Account</Button><Button onPress={()=>navigation.navigate('Login')}>Already have an account? Login</Button>
 </ScrollView></KeyboardAvoidingView></View>
}
function Login({navigation}){const [email,E]=useState(''),[password,P]=useState(''),[busy,B]=useState(false);async function go(){if(!email.trim()||!password)return Alert.alert('Missing details','Enter email and password.');B(true);try{await signInWithEmailAndPassword(auth,email.trim(),password)}catch(e){Alert.alert('Login failed',err(e))}finally{B(false)}}return <View style={[styles.screen,{justifyContent:'center'}]}><View style={styles.form}><Text variant="headlineMedium" style={{color:TEAL,fontWeight:'bold'}}>Welcome Back</Text><Text style={styles.sub}>Login to continue to MediCare</Text><Field label="Email" value={email} onChangeText={E} autoCapitalize="none" keyboardType="email-address"/><Field label="Password" value={password} onChangeText={P} secureTextEntry/><Button mode="contained" onPress={go} loading={busy} style={styles.button}>Login</Button><Button onPress={()=>navigation.navigate('Register')}>Don't have an account? Create Account</Button><Button onPress={async()=>{if(!email.trim())return Alert.alert('Enter email','Enter your email first.');try{await sendPasswordResetEmail(auth,email.trim());Alert.alert('Email sent','Check your inbox.')}catch(e){Alert.alert('Error',err(e))}}}>Forgot Password?</Button></View></View>}

function useCollection(name){const [items,setItems]=useState([]),[loading,setLoading]=useState(true);useEffect(()=>{const uid=auth.currentUser?.uid;if(!uid){setLoading(false);return}const q=query(collection(db,name),where('userId','==',uid));return onSnapshot(q,s=>{setItems(s.docs.map(d=>({id:d.id,...d.data()})));setLoading(false)},e=>{console.log(e);setLoading(false)})},[name]);return {items,loading}}
function useProfile(){const [profile,setProfile]=useState(null);useEffect(()=>{const uid=auth.currentUser?.uid;if(!uid)return;return onSnapshot(doc(db,'users',uid),s=>setProfile(s.exists()?s.data():null))},[]);return profile}
function useDoctors(){const [doctors,setDoctors]=useState(SAMPLE_DOCTORS),[loading,setLoading]=useState(true);useEffect(()=>onSnapshot(collection(db,'doctors'),s=>{const d=s.docs.map(x=>({id:x.id,...x.data()}));setDoctors(d.length?d:SAMPLE_DOCTORS);setLoading(false)},()=>{setDoctors(SAMPLE_DOCTORS);setLoading(false)}),[]);return {doctors,loading}}
function DoctorCard({ d, onPress }) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content style={styles.row}>
        <Avatar.Text
          size={58}
          label={(d.name || 'Dr').replace('Dr. ', '').slice(0, 2).toUpperCase()}
        />

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: '#212121', fontWeight: 'bold' }}>
            {d.name}
          </Text>

          <Text style={{ color: '#424242' }}>{d.speciality}</Text>
          <Text style={{ color: '#424242' }}>
            {d.experience} • {d.location}
          </Text>

          <Text style={{ color: '#00796B', fontWeight: 'bold' }}>
            ₹{d.fees} • ★ {d.rating || '4.5'}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}function AppointmentCard({a,onCancel}){return <Card style={styles.card}><Card.Content><View style={styles.space}><Text variant="titleMedium" style={{color:'#212121', fontWeight:'bold'}}>{a.doctorName}</Text><Badge style={{backgroundColor:a.status==='Cancelled'?'#C62828':a.status==='Completed'?'#2E7D32':TEAL}}>{a.status}</Badge></View><Text style={{color:'#424242'}}>{a.doctorSpeciality}</Text><Text style={{color:'#212121',marginTop:8}}>📅 {DATE(a.date)}  •  🕒 {a.time}</Text><Text style={styles.muted}>Reason: {a.reason}</Text>{onCancel&&a.status==='Confirmed'&&<Button textColor="#C62828" onPress={onCancel}>Cancel Appointment</Button>}</Card.Content></Card>}

function Home({navigation}){const profile=useProfile(),{doctors}=useDoctors(),{items:reminders}=useCollection('reminders'),{items:appointments}=useCollection('appointments');const [search,setSearch]=useState('');const filtered=doctors.filter(d=>`${d.name} ${d.speciality}`.toLowerCase().includes(search.toLowerCase()));const next=appointments.find(a=>a.status==='Confirmed'&&a.date>=TODAY());return <View style={styles.screen}><ScrollView contentContainerStyle={styles.pad}><Text variant="headlineSmall" style={styles.title}>Hello, {profile?.name?.split(' ')[0]||'there'} 👋</Text><Searchbar placeholder="Search Doctors by Name / Speciality..." value={search} onChangeText={setSearch} style={styles.search}/>{search?filtered.map(d=><DoctorCard key={d.id} d={d} onPress={()=>navigation.navigate('DoctorDetails',{doctor:d})}/>):<>
 <Card style={[styles.card,{backgroundColor:'#E0F2F1'}]}><Card.Content><View style={styles.row}><Avatar.Icon icon="hospital-building" color={TEAL} style={{backgroundColor:'white'}}/><View style={{marginLeft:12,flex:1}}><Text variant="titleLarge" style={{color:'#004D40',fontWeight:'bold'}}>MediCare Health Services</Text><Text style={{color:'#00695C',fontWeight:'600'}}>Trusted healthcare in Goa</Text></View></View><Text style={{marginTop:12,lineHeight:21,color:'#004D40'}}>MediCare connects patients with doctors in Goa. Book appointments, manage medicine reminders and find authentic medicine label information — all in one place.</Text><Text style={{color:'#004D40',fontWeight:'bold',marginTop:8}}>50+ Doctors  •  1000+ Patients  •  4.8 Rating</Text><Button mode="contained" style={styles.button} onPress={()=>navigation.navigate('Doctors')}>Book Appointment Now</Button></Card.Content></Card>
 <Section>Top Doctors</Section><ScrollView horizontal showsHorizontalScrollIndicator={false}>{doctors.slice(0,4).map(d=><Card key={d.id} style={[styles.card,{width:230,marginRight:10}]} onPress={()=>navigation.navigate('DoctorDetails',{doctor:d})}><Card.Content><Avatar.Text size={48} label={d.name.slice(0,2)}/><Text variant="titleMedium" style={{color:'#212121', fontWeight:'bold',marginTop:8}}>{d.name}</Text><Text style={{color:'#424242'}}>{d.speciality}</Text><Text style={{color:TEAL}}>₹{d.fees}</Text></Card.Content></Card>)}</ScrollView>
 <Section>Today's Reminders</Section>{reminders.filter(r=>!r.days?.length||r.days.includes(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()])).length?reminders.map(r=><Card key={r.id} style={styles.card}><Card.Content><Text variant="titleMedium" style={{color:'#212121',fontWeight:"bold"}}>{r.medicineName}</Text><Text style={{color:'#424242'}}>{r.dosage} • {r.time}</Text></Card.Content></Card>):<Empty text="No reminders for today"/>}
 <Section>Upcoming Appointment</Section>{next?<AppointmentCard a={next}/>:<Empty text="No upcoming appointment"/>}</>}</ScrollView></View>}

function Doctors({navigation}){const {doctors,loading}=useDoctors();const [filter,F]=useState('All'),[search,S]=useState('');const list=doctors.filter(d=>(filter==='All'||d.speciality===filter)&&`${d.name} ${d.speciality}`.toLowerCase().includes(search.toLowerCase()));return <View style={styles.screen}><View style={styles.pad}><Text variant="headlineSmall" style={styles.title}>Find Doctor</Text><Text style={styles.sub}>Choose a doctor for your consultation</Text><Searchbar placeholder="Search doctors..." value={search} onChangeText={S} style={styles.search}/><ScrollView horizontal style={{maxHeight:48,marginBottom:8}}>{FILTERS.map(x=><Chip key={x} selected={filter===x} onPress={()=>F(x)} style={{marginRight:7}}>{x}</Chip>)}</ScrollView>{loading?<Loading/>:<FlatList data={list} keyExtractor={x=>x.id} renderItem={({item})=><DoctorCard d={item} onPress={()=>navigation.navigate('DoctorDetails',{doctor:item})}/>} ListEmptyComponent={<Empty/>}/>}</View></View>}
function DoctorDetails({route,navigation}){const d=route.params.doctor;const [date,D]=useState(TODAY()),[showDate,SD]=useState(false),[time,T]=useState(''),[reason,R]=useState(''),[busy,B]=useState(false);async function book(){if(!time||!reason.trim())return Alert.alert('Missing details','Select a time and enter reason for visit.');if(date<TODAY())return Alert.alert('Invalid date','Choose today or a future date.');B(true);try{await addDoc(collection(db,'appointments'),{userId:auth.currentUser.uid,doctorId:d.id,doctorName:d.name,doctorSpeciality:d.speciality,date,time,reason:reason.trim(),status:'Confirmed',createdAt:serverTimestamp()});Alert.alert('Appointment confirmed','Your appointment has been booked.',[{text:'View appointments',onPress:()=>navigation.navigate('HomeTabs',{screen:'Appointments'})}])}catch(e){Alert.alert('Booking failed',err(e))}finally{B(false)}}return <View style={styles.screen}><ScrollView contentContainerStyle={styles.pad}><Card style={styles.card}><Card.Content style={{alignItems:'center'}}><Avatar.Text size={100} label={d.name.slice(0,2)}/><Text variant="headlineSmall" style={{fontWeight:'bold',marginTop:10}}>{d.name}</Text><Text style={{color:TEAL}}>{d.speciality}</Text><Text style={styles.muted}>{d.experience} • {d.location}</Text><Text style={{color:TEAL,fontWeight:'bold'}}>₹{d.fees} • ★ {d.rating}</Text><Text style={{textAlign:'center',marginTop:12}}>{d.about}</Text></Card.Content></Card><Section>Book an Appointment</Section><Button mode="outlined" icon="calendar" onPress={()=>SD(true)}>Select Date: {DATE(date)}</Button>{showDate&&<DateTimePicker value={new Date(`${date}T12:00:00`)} mode="date" minimumDate={new Date()} onChange={(e,x)=>{SD(false);if(x)D(x.toISOString().slice(0,10))}}/>}<Text style={styles.label}>Select Time Slot</Text><View style={styles.chips}>{TIMES.map(x=><Chip key={x} selected={time===x} onPress={()=>T(x)}>{x}</Chip>)}</View><Field label="Reason for Visit" value={reason} onChangeText={R} placeholder="e.g. Fever, Checkup"/><Button mode="contained" loading={busy} onPress={book} style={styles.button}>Confirm Appointment</Button></ScrollView></View>}

function ReminderForm({visible,item,onClose}){const [name,N]=useState(''),[dose,Q]=useState('1 tablet'),[time,T]=useState('8:00 AM'),[days,D]=useState(DAYS),[busy,B]=useState(false);useEffect(()=>{N(item?.medicineName||'');Q(item?.dosage||'1 tablet');T(item?.time||'8:00 AM');D(item?.days||DAYS)},[item,visible]);if(!visible)return null;async function save(){if(!name.trim()||!dose.trim()||!time.trim()||!days.length)return Alert.alert('Missing details','Complete all reminder fields.');B(true);const data={userId:auth.currentUser.uid,medicineName:name.trim(),dosage:dose.trim(),time:time.trim(),days};try{if(item?.id)await updateDoc(doc(db,'reminders',item.id),data);else await addDoc(collection(db,'reminders'),{...data,createdAt:serverTimestamp()});onClose()}catch(e){Alert.alert('Error',err(e))}finally{B(false)}}return <View style={styles.modal}><Card><Card.Content><Text variant="titleLarge" style={styles.title}>{item?'Edit Reminder':'Add Reminder'}</Text><Field label="Medicine Name" value={name} onChangeText={N}/><Field label="Dosage" value={dose} onChangeText={Q}/><Field label="Time (e.g. 8:00 AM)" value={time} onChangeText={T}/><Text style={styles.label}>Days</Text><View style={styles.chips}>{DAYS.map(x=><Chip key={x} selected={days.includes(x)} onPress={()=>D(p=>p.includes(x)?p.filter(y=>y!==x):[...p,x])}>{x}</Chip>)}</View><Button mode="contained" loading={busy} onPress={save} style={styles.button}>Save Reminder</Button><Button onPress={onClose}>Close</Button></Card.Content></Card></View>}
function Medicines(){const [search,S]=useState(''),[results,R]=useState([]),[busy,B]=useState(false),[modal,M]=useState(false),[editing,E]=useState(null);const {items,loading}=useCollection('reminders');async function lookup(){if(!search.trim())return;B(true);try{const u=`https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encodeURIComponent(search.trim())}&limit=5`;const res=await fetch(u);if(!res.ok)throw Error('No results');const json=await res.json();const rows=(json.results||[]).map((x,i)=>({id:String(i),brand:x.openfda?.brand_name?.[0]||search,generic:x.openfda?.generic_name?.[0]||'Not listed',uses:x.indications_and_usage?.[0]||x.purpose?.[0]||'Uses not listed.',warnings:x.warnings?.[0]||x.warnings_and_cautions?.[0]||'Consult a healthcare professional.'}));if(!rows.length)throw Error('No results');R(rows)}catch{R([{id:'fallback',brand:search,generic:'Not listed',uses:'Medicine information could not be retrieved.',warnings:'Check the package label and consult a pharmacist or doctor.'}])}finally{B(false)}}async function remove(id){Alert.alert('Delete reminder?','This cannot be undone.',[{text:'Keep',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>deleteDoc(doc(db,'reminders',id)).catch(e=>Alert.alert('Error',err(e)))}])}return <View style={styles.screen}><ScrollView contentContainerStyle={styles.pad}><Text variant="headlineSmall" style={styles.title}>Medicines</Text><Text style={styles.sub}>Search medicine information and manage reminders</Text><Searchbar placeholder="Search Medicine - e.g. Crocin, Paracetamol" value={search} onChangeText={S} onSubmitEditing={lookup} style={styles.search}/><Button mode="contained" loading={busy} onPress={lookup} style={styles.button}>Search Medicine</Button>{results.map(x=><Card key={x.id} style={styles.card}><Card.Content><Text
  variant="titleMedium"
  style={{ color: '#212121', fontWeight: 'bold' }}
>
  {x.brand}
</Text>

<Text style={{ color: '#424242' }}>
  Generic: {x.generic}
</Text>

<Text style={styles.label}>Uses</Text>
<Text style={{ color: '#212121' }} numberOfLines={5}>
  {x.uses}
</Text>

<Text style={styles.label}>Warnings</Text>
<Text style={{ color: '#212121' }} numberOfLines={5}>
  {x.warnings}
</Text><HelperText type="info">Not a substitute for professional medical advice.</HelperText></Card.Content></Card>)}<Divider style={{marginVertical:16}}/><View style={styles.space}><Text variant="titleLarge" style={styles.title}>My Medicine Reminders</Text><Button onPress={()=>{E(null);M(true)}}>+ Add Reminder</Button></View>{loading?<Loading/>:items.length?items.map(x=><Card key={x.id} style={styles.card}><Card.Content><View style={styles.space}><Text variant="titleMedium" style={{color:'#212121', fontWeight:'bold'}}>{x.medicineName}</Text><View style={styles.row}><Button compact onPress={()=>{E(x);M(true)}}>Edit</Button><Button compact textColor="#C62828" onPress={()=>remove(x.id)}>Delete</Button></View></View><Text style={{color:"#424242"}}>{x.dosage} • {x.time}</Text><Text style={{color:"#424242"}}>{(x.days||[]).join(', ')}</Text></Card.Content></Card>):<Empty/>}</ScrollView><ReminderForm visible={modal} item={editing} onClose={()=>M(false)}/></View>}
function Appointments({navigation}){const {items,loading}=useCollection('appointments');const [tab,T]=useState('upcoming');const filtered=items.filter(a=>tab==='cancelled'?a.status==='Cancelled':tab==='completed'?(a.status==='Completed'||(a.date&&a.date<TODAY())):a.status==='Confirmed'&&a.date>=TODAY());async function cancel(id){Alert.alert('Cancel appointment?','Are you sure?', [{text:'No',style:'cancel'},{text:'Yes',style:'destructive',onPress:()=>updateDoc(doc(db,'appointments',id),{status:'Cancelled'}).catch(e=>Alert.alert('Error',err(e)))}])}return <View style={styles.screen}><View style={styles.pad}><Text variant="headlineSmall" style={styles.title}>Appointments</Text><Text style={styles.sub}>View and manage your doctor visits</Text><Button mode="contained" style={styles.button} onPress={()=>navigation.navigate('Doctors')}>Book New Appointment</Button><SegmentedButtons value={tab} onValueChange={T} buttons={[{value:'upcoming',label:'Upcoming'},{value:'completed',label:'Completed'},{value:'cancelled',label:'Cancelled'}]}/>{loading?<Loading/>:<FlatList style={{marginTop:12}} data={filtered} keyExtractor={x=>x.id} renderItem={({item})=><AppointmentCard a={item} onCancel={()=>cancel(item.id)}/>} ListEmptyComponent={<Empty/>}/>}</View></View>}
function Profile(){const profile=useProfile(),{items}=useCollection('appointments');const rows=[['Full Name',profile?.name],['Email',profile?.email||auth.currentUser?.email],['Gender',profile?.gender],['Date of Birth',profile?.dob],['Phone Number',profile?.phone],['Address',profile?.address],['Blood Group',profile?.bloodGroup]];return <View style={styles.screen}><ScrollView contentContainerStyle={styles.pad}><Card style={styles.card}><Card.Content style={{alignItems:'center'}}><Avatar.Text size={76} label={(profile?.name||auth.currentUser?.email||'M').slice(0,1).toUpperCase()}/><Text variant="titleLarge" style={{fontWeight:'bold',marginTop:10, color:'#212121'}}>{profile?.name||'MediCare Patient'}</Text><Text style={styles.muted}>{profile?.email||auth.currentUser?.email}</Text></Card.Content></Card><Section>Personal Details</Section><Card style={styles.card}><Card.Content>{rows.map(([k,v])=><View key={k} style={{marginBottom:12}}><Text style={{color:'#424242',fontWeight:'600'}}>{k}</Text><Text style={{color:'#212121',fontWeight:'bold', marginTop:3}} >{v||'Not provided'}</Text></View>)}</Card.Content></Card><Card style={styles.card}><Card.Content><Text variant="titleMedium" style={{color:"#212121", fontWeight:"bold"}}>My Appointments</Text><Text variant="headlineMedium" style={{color:TEAL}}>{items.length}</Text></Card.Content></Card><Button mode="outlined" textColor="#C62828" icon="logout" onPress={()=>signOut(auth)} style={{marginTop:12}}>Logout</Button></ScrollView></View>}
function Tabs(){return <Tab.Navigator screenOptions={({route})=>({headerShown:false,tabBarActiveTintColor:TEAL,tabBarIcon:({color,size})=><Ionicons name={{Home:'home',Medicines:'medkit',Appointments:'calendar',Profile:'person'}[route.name]} size={size} color={color}/>})}><Tab.Screen name="Home" component={Home}/><Tab.Screen name="Medicines" component={Medicines}/><Tab.Screen name="Appointments" component={Appointments}/><Tab.Screen name="Profile" component={Profile}/></Tab.Navigator>}
export default function App(){const [user,U]=useState(undefined),[splash,S]=useState(true);useEffect(()=>{const t=setTimeout(()=>S(false),2500);const unsub=onAuthStateChanged(auth,U);return()=>{clearTimeout(t);unsub()}},[]);if(splash||user===undefined)return <PaperProvider theme={DARK_THEME}><Splash/></PaperProvider>;return <PaperProvider theme={DARK_THEME}><NavigationContainer><Stack.Navigator screenOptions={{headerShown:false}}>{user?<><Stack.Screen name="HomeTabs" component={Tabs}/><Stack.Screen name="Doctors" component={Doctors} options={{headerShown:true,title:'Find Doctor'}}/><Stack.Screen name="DoctorDetails" component={DoctorDetails} options={{headerShown:true,title:'Doctor Details'}}/></>:<><Stack.Screen name="Register" component={Register}/><Stack.Screen name="Login" component={Login}/></>}</Stack.Navigator></NavigationContainer></PaperProvider>}
