"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EntrarPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        // Sucesso! Vai para a página inicial
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error || "Ocorreu um erro. Tente novamente.");
      }
    } catch (err) {
      setError("Erro de conexão. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="p-8 bg-white rounded-xl shadow-md max-w-sm w-full">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-3 rounded-xl">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2 text-center text-slate-900">
          {isLogin ? "Seu espaço financeiro" : "Criar nova conta"}
        </h2>
        <p className="text-slate-500 mb-6 text-sm text-center">
          {isLogin ? "Entre com seu e-mail e senha." : "Cadastre-se para salvar seus registros."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Seu e-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              placeholder="seu@email.com"
              required 
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-slate-700">Sua senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              placeholder="••••••••"
              required 
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium rounded-lg p-2.5 mt-2 hover:bg-blue-700 transition-colors disabled:opacity-70"
          >
            {loading ? "Aguarde..." : (isLogin ? "Entrar" : "Criar conta")}
          </button>
        </form>

        <button 
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }} 
          className="text-blue-600 text-sm mt-6 w-full text-center hover:underline font-medium"
        >
          {isLogin ? "Não tem uma conta? Crie uma" : "Já tem conta? Faça login"}
        </button>
      </div>
    </div>
  );
}