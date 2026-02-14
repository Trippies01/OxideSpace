# 📚 Context API ve Custom Hooks - Kaynaklar ve Linkler

## 🎯 Resmi React Dokümantasyonu

### 1. Context API
- **React Context API (Türkçe)**: https://tr.legacy.reactjs.org/docs/context.html
- **React Context API (İngilizce - Güncel)**: https://react.dev/reference/react/createContext
- **Context ile State Yönetimi**: https://tr.react.dev/learn/passing-data-deeply-with-context

### 2. Custom Hooks
- **Custom Hooks Rehberi**: https://tr.react.dev/learn/reusing-logic-with-custom-hooks
- **Hook Kuralları**: https://tr.react.dev/learn/reusing-logic-with-custom-hooks#rules-of-hooks

### 3. State Management
- **State Yönetimi**: https://tr.react.dev/learn/managing-state
- **useReducer Hook**: https://tr.react.dev/reference/react/useReducer

---

## 📖 Öğretici Kaynaklar

### 4. Context API Best Practices
- **Kent C. Dodds - Context API**: https://kentcdodds.com/blog/how-to-use-react-context-effectively
- **React Context Pattern**: https://www.patterns.dev/react/context-pattern

### 5. Custom Hooks Patterns
- **usehooks-ts Library**: https://usehooks-ts.com/ (Örnek custom hooks)
- **React Hooks Patterns**: https://reactpatterns.com/

### 6. State Management Patterns
- **State Colocation**: https://kentcdodds.com/blog/state-colocation-will-make-your-react-app-faster
- **Compound Components Pattern**: https://kentcdodds.com/blog/compound-components-with-react-hooks

---

## 🛠️ Pratik Örnekler

### 7. Context API Örnekleri
- **React Context Example**: https://github.com/facebook/react/tree/main/packages/react-dom/examples/context
- **TypeScript + Context**: https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context

### 8. Custom Hooks Örnekleri
- **Awesome React Hooks**: https://github.com/rehooks/awesome-react-hooks
- **usehooks.com**: https://usehooks.com/ (Pratik hook örnekleri)

---

## 📝 Projemiz İçin Önerilen Yapı

### Context'ler:
1. **ServerContext** - Server ve channel yönetimi
2. **VoiceContext** - Voice channel state
3. **MessageContext** - Mesaj yönetimi
4. **UIContext** - Toast, modal, loading states

### Custom Hooks:
1. **useVoiceChannel** - Voice channel logic
2. **useServerManagement** - Server CRUD operations
3. **useMessageManagement** - Message operations
4. **useToast** - Toast notifications

---

## 🚀 Hızlı Başlangıç

### Context Oluşturma:
```typescript
// 1. Context oluştur
const ServerContext = createContext<ServerContextType | undefined>(undefined);

// 2. Provider component
export function ServerProvider({ children }: { children: React.ReactNode }) {
  const [servers, setServers] = useState<Server[]>([]);
  // ... logic
  
  return (
    <ServerContext.Provider value={{ servers, setServers }}>
      {children}
    </ServerContext.Provider>
  );
}

// 3. Custom hook
export function useServerContext() {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServerContext must be used within ServerProvider');
  }
  return context;
}
```

---

## 📚 Ek Kaynaklar

- **React TypeScript Cheatsheet**: https://react-typescript-cheatsheet.netlify.app/
- **React Patterns**: https://reactpatterns.com/
- **React Performance**: https://react.dev/learn/render-and-commit

---

**Sonraki Adım**: Bu kaynakları kullanarak Context API ve custom hooks implementasyonuna başlayalım!
