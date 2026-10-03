export interface Question {
  id: number;
  text: string;
  options: string[];
  answer: string;
  mediaUrl?: string;
}

export const DEFAULT_QUESTIONS_1: Question[] = [
  { id: 1, text: "What is the standard port for HTTPS communication?", options: ["Port 21", "Port 80", "Port 443", "Port 8080"], answer: "Port 443" },
  { id: 2, text: "Decode this string: YWRtaW4=", options: ["root", "admin", "password", "system"], answer: "admin" },
  { id: 3, text: "What does XSS stand for?", options: ["Cross Site Scripting", "XML System Security", "Cross System Scripting", "Extensible Style Sheets"], answer: "Cross Site Scripting" },
  { id: 4, text: "What protocol resolves IP addresses to MAC addresses?", options: ["DNS", "DHCP", "ARP", "ICMP"], answer: "ARP" },
  { id: 5, text: "A widely used 128-bit hash function that is considered cryptographically broken.", options: ["SHA-256", "MD5", "AES", "RSA"], answer: "MD5" },
  { id: 6, text: "What type of attack involves overwhelming a target server with traffic?", options: ["Phishing", "DDoS", "SQL Injection", "Man in the middle"], answer: "DDoS" },
  { id: 7, text: "Which widely used tool is known as a network protocol analyzer?", options: ["Nmap", "Wireshark", "Metasploit", "Burp Suite"], answer: "Wireshark" },
  { id: 8, text: "In Linux, what is the absolute path to the file containing hashed user passwords?", options: ["/etc/passwd", "/etc/shadow", "/var/log/auth", "/root/passwords"], answer: "/etc/shadow" },
  { id: 9, text: "What is the practice of hiding a secret message inside an ordinary file (like an image)?", options: ["Cryptography", "Steganography", "Obfuscation", "Hashing"], answer: "Steganography" },
  { id: 10, text: "What command line tool is used to discover the path a packet takes to a destination network?", options: ["ping", "netstat", "ifconfig", "traceroute"], answer: "traceroute" },
];

export const DEFAULT_QUESTIONS_2: Question[] = [
  { id: 1, text: "Identify the vulnerability shown in this source code snippet.", options: ["SQL Injection", "XSS", "Buffer Overflow", "CSRF"], answer: "SQL Injection", mediaUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000&auto=format&fit=crop" },
  { id: 2, text: "What is this physical security device commonly known as?", options: ["Rubber Ducky", "YubiKey", "LAN Turtle", "WiFi Pineapple"], answer: "Rubber Ducky", mediaUrl: "https://images.unsplash.com/photo-1614064641913-6b717b01d1d8?q=80&w=1000&auto=format&fit=crop" },
  { id: 3, text: "Examine this network topology diagram. Where should the WAF be placed?", options: ["Position A", "Position B", "Position C", "Position D"], answer: "Position B", mediaUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1000&auto=format&fit=crop" },
];

export const DEFAULT_QUESTIONS_3: Question[] = [
  { id: 1, text: "What type of attack is being demonstrated in this network traffic capture?", options: ["ARP Spoofing", "DNS Poisoning", "SYN Flood", "BGP Hijacking"], answer: "SYN Flood", mediaUrl: "https://cdn.pixabay.com/video/2021/08/04/83896-584737275_tiny.mp4" },
  { id: 2, text: "Identify the malware behavior shown in this sandbox execution video.", options: ["Ransomware Encryption", "Keylogging", "Crypto Mining", "Botnet C2 Beacons"], answer: "Ransomware Encryption", mediaUrl: "https://cdn.pixabay.com/video/2019/01/22/20864-313175056_tiny.mp4" },
];

export const getQuestions = (sessionNumber: number): Question[] => {
  const local = localStorage.getItem(`cyberhunt_questions_${sessionNumber}`);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error(e);
    }
  }
  if (sessionNumber === 1) return DEFAULT_QUESTIONS_1;
  if (sessionNumber === 2) return DEFAULT_QUESTIONS_2;
  if (sessionNumber === 3) return DEFAULT_QUESTIONS_3;
  return [];
};

export const saveQuestions = (sessionNumber: number, questions: Question[]) => {
  localStorage.setItem(`cyberhunt_questions_${sessionNumber}`, JSON.stringify(questions));
};
