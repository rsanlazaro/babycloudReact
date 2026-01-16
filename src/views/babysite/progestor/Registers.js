
import React, { useState } from 'react';
import { Plus, ArrowLeft, FileText } from 'lucide-react';

const SecretButton = ({ onClick }) => (
    <button
        onClick={onClick}
        className="fixed bottom-4 right-4 w-3 h-3 bg-gray-200 hover:bg-gray-300 rounded-full opacity-20 hover:opacity-100 transition-opacity"
        aria-label="Secret access"
    />
);

const PasswordView = ({ onSuccess }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === 'admin123') {
            onSuccess();
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Acceso Restringido</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Contraseña"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {error && <p className="text-red-500 text-sm mb-4">Contraseña incorrecta</p>}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Ingresar
                    </button>
                </form>
            </div>
        </div>
    );
};

const ProgramsView = ({ onAddProgram, programs, onEditProgram }) => {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Programas IP</h1>
                    <button
                        onClick={onAddProgram}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Agregar Programa
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre IP</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">País</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Valor</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {programs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No hay programas registrados. Agrega uno nuevo para comenzar.
                                    </td>
                                </tr>
                            ) : (
                                programs.map((program, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">{program.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{program.country}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{program.date}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{program.value}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <button
                                                onClick={() => onEditProgram(idx)}
                                                className="text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                Ver detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ProgramForm = ({ onBack, program, onSave }) => {
    const [formData, setFormData] = useState(program || {
        name: '', couple_name: '', country: '', date: '', deposit_1: 'Kiromedic',
        deposit_2: 'Kiromedic', donant: '', select_2: '', select_3: '', select_r: '',
        catalog: 'Kiromedic', value: 0, crio: 1, xx: 1, xy: 1, ni: 1, tank: '',
        pregnant: '', birth: '', clabe: '', assurance: '', policy: '', manager: ''
    });
    const [currency, setCurrency] = useState(program?.currency || 'EUR');
    const [phases, setPhases] = useState(program?.phases || []);
    const [newPhase, setNewPhase] = useState({ name: '', value: 0 });
    const [expenses, setExpenses] = useState(program?.expenses || []);
    const [newExpense, setNewExpense] = useState({
        date: '', movement: 'entrada', reason: 'Poder notarial',
        destination: '', bank: '', value: 0, notes: ''
    });

    const addPhase = () => {
        if (newPhase.name && newPhase.value > 0) {
            setPhases([...phases, {
                ...newPhase,
                payments: [0, 0, 0],
                invoiced: false,
                notes: ''
            }]);
            setNewPhase({ name: '', value: 0 });
        }
    };

    const updatePhasePayment = (index, paymentIndex, value) => {
        const updated = [...phases];
        updated[index].payments[paymentIndex] = parseFloat(value) || 0;
        setPhases(updated);
    };

    const toggleInvoiced = (index) => {
        const updated = [...phases];
        updated[index].invoiced = !updated[index].invoiced;
        setPhases(updated);
    };

    const addExpense = () => {
        if (newExpense.date && newExpense.value !== 0) {
            setExpenses([...expenses, newExpense]);
            setNewExpense({
                date: '', movement: 'entrada', reason: 'Poder notarial',
                destination: '', bank: '', value: 0, notes: ''
            });
        }
    };

    const totalPhaseValue = phases.reduce((sum, p) => sum + parseFloat(p.value || 0), 0);
    const totalExpenseOut = expenses
        .filter(e => e.movement === 'salida')
        .reduce((sum, e) => sum + parseFloat(e.value || 0), 0);
    const totalExpenseIn = expenses
        .filter(e => e.movement === 'entrada')
        .reduce((sum, e) => sum + parseFloat(e.value || 0), 0);

    const handleSave = () => {
        onSave({ ...formData, phases, expenses, currency });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
                >
                    <ArrowLeft size={20} />
                    Volver a Programas
                </button>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Datos del programa</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre IP</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pareja IP</label>
                            <input
                                type="text"
                                value={formData.couple_name}
                                onChange={(e) => setFormData({ ...formData, couple_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de contrato</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Depósito 1</label>
                            <select
                                value={formData.deposit_1}
                                onChange={(e) => setFormData({ ...formData, deposit_1: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option>Kiromedic</option>
                                <option>Umare</option>
                                <option>Care</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Depósito 2</label>
                            <select
                                value={formData.deposit_2}
                                onChange={(e) => setFormData({ ...formData, deposit_2: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option>Kiromedic</option>
                                <option>Umare</option>
                                <option>Care</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Donante Select</label>
                            <input
                                type="text"
                                value={formData.donant}
                                onChange={(e) => setFormData({ ...formData, donant: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select 2</label>
                            <input
                                type="text"
                                value={formData.select_2}
                                onChange={(e) => setFormData({ ...formData, select_2: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select 3</label>
                            <input
                                type="text"
                                value={formData.select_3}
                                onChange={(e) => setFormData({ ...formData, select_3: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select R</label>
                            <input
                                type="text"
                                value={formData.select_r}
                                onChange={(e) => setFormData({ ...formData, select_r: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Catálogo</label>
                            <select
                                value={formData.catalog}
                                onChange={(e) => setFormData({ ...formData, catalog: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option>Kiromedic</option>
                                <option>Ovodonors</option>
                                <option>Nora</option>
                                <option>Eggdonors</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                            <input
                                type="number"
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Crio embrio</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={formData.crio}
                                onChange={(e) => setFormData({ ...formData, crio: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">XX</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={formData.xx}
                                onChange={(e) => setFormData({ ...formData, xx: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">XY</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={formData.xy}
                                onChange={(e) => setFormData({ ...formData, xy: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">NI</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={formData.ni}
                                onChange={(e) => setFormData({ ...formData, ni: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanque</label>
                            <input
                                type="text"
                                value={formData.tank}
                                onChange={(e) => setFormData({ ...formData, tank: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gestante</label>
                            <input
                                type="text"
                                value={formData.pregnant}
                                onChange={(e) => setFormData({ ...formData, pregnant: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Parto</label>
                            <input
                                type="text"
                                value={formData.birth}
                                onChange={(e) => setFormData({ ...formData, birth: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Clabe</label>
                            <input
                                type="number"
                                value={formData.clabe}
                                onChange={(e) => setFormData({ ...formData, clabe: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Seguro</label>
                            <input
                                type="text"
                                value={formData.assurance}
                                onChange={(e) => setFormData({ ...formData, assurance: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Póliza</label>
                            <input
                                type="text"
                                value={formData.policy}
                                onChange={(e) => setFormData({ ...formData, policy: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gestor</label>
                            <input
                                type="text"
                                value={formData.manager}
                                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Resumen de caja</h2>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <p className="text-lg">
                            <span className="font-semibold">Valor del programa:</span> {totalPhaseValue.toFixed(2)} {currency}
                        </p>
                        <p className="text-lg">
                            <span className="font-semibold">Costo interno (MXN):</span> {totalExpenseOut.toFixed(2)} MXN
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Fases del programa</h2>

                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="Nombre de la fase"
                            value={newPhase.name}
                            onChange={(e) => setNewPhase({ ...newPhase, name: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="number"
                            placeholder="Valor"
                            value={newPhase.value}
                            onChange={(e) => setNewPhase({ ...newPhase, value: e.target.value })}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={addPhase}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-1"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-4 py-2 text-left">Fase</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Valor</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Pago 1</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Pago 2</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Pago 3</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Facturado</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Estado</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Notas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {phases.map((phase, idx) => {
                                    const totalPaid = phase.payments.reduce((s, p) => s + p, 0);
                                    const remaining = phase.value - totalPaid;
                                    const status = remaining <= 0 ? 'Finalizado' : `Pendiente: ${remaining.toFixed(2)} ${currency}`;

                                    return (
                                        <tr key={idx}>
                                            <td className="border border-gray-300 px-4 py-2">{phase.name}</td>
                                            <td className="border border-gray-300 px-4 py-2">{phase.value} {currency}</td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={phase.payments[0]}
                                                    onChange={(e) => updatePhasePayment(idx, 0, e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={phase.payments[1]}
                                                    onChange={(e) => updatePhasePayment(idx, 1, e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={phase.payments[2]}
                                                    onChange={(e) => updatePhasePayment(idx, 2, e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 text-center">
                                                <button
                                                    onClick={() => toggleInvoiced(idx)}
                                                    className={`px-3 py-1 rounded ${phase.invoiced ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
                                                >
                                                    {phase.invoiced ? 'Sí' : 'No'}
                                                </button>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <span className={remaining <= 0 ? 'text-green-600 font-semibold' : 'text-orange-600'}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 text-center">
                                                <button className="text-blue-600 hover:text-blue-700">
                                                    <FileText size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Extrato gastos</h2>

                    <div className="grid grid-cols-7 gap-2 mb-4">
                        <input
                            type="date"
                            value={newExpense.date}
                            onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={newExpense.movement}
                            onChange={(e) => setNewExpense({ ...newExpense, movement: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="entrada">Entrada</option>
                            <option value="salida">Salida</option>
                        </select>
                        <select
                            value={newExpense.reason}
                            onChange={(e) => setNewExpense({ ...newExpense, reason: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option>Poder notarial</option>
                            <option>Depósito semen</option>
                            <option>COM. VENTA</option>
                            <option>FIV</option>
                            <option>Captura OVO</option>
                            <option>Factura IP</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Destino"
                            value={newExpense.destination}
                            onChange={(e) => setNewExpense({ ...newExpense, destination: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            placeholder="Banco"
                            value={newExpense.bank}
                            onChange={(e) => setNewExpense({ ...newExpense, bank: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="number"
                            placeholder="Valor MXN"
                            value={newExpense.value}
                            onChange={(e) => setNewExpense({ ...newExpense, value: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={addExpense}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-1"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-4 py-2 text-left">Fecha</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Movimiento</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Motivo</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Destino</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Banco</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Valor (MXN)</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left">Notas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((expense, idx) => (
                                    <tr key={idx}>
                                        <td className="border border-gray-300 px-4 py-2">{expense.date}</td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <span className={expense.movement === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                                                {expense.movement}
                                            </span>
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">{expense.reason}</td>
                                        <td className="border border-gray-300 px-4 py-2">{expense.destination}</td>
                                        <td className="border border-gray-300 px-4 py-2">{expense.bank}</td>
                                        <td className="border border-gray-300 px-4 py-2">{expense.value}</td>
                                        <td className="border border-gray-300 px-4 py-2">{expense.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 space-y-2">
                        <p className="text-lg">
                            <span className="font-semibold">Total gastos salida:</span>
                            <span className="text-red-600"> {totalExpenseOut.toFixed(2)} MXN</span>
                        </p>
                        <p className="text-lg">
                            <span className="font-semibold">Total costos entrada:</span>
                            <span className="text-green-600"> {totalExpenseIn.toFixed(2)} MXN</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
                >
                    Guardar Programa
                </button>
            </div>
        </div>
    );
};

export default function App() {
    const [username, setUsername] = useState('rafa');
    const [view, setView] = useState('main');
    const [programs, setPrograms] = useState([]);
    const [editingProgram, setEditingProgram] = useState(null);

    const showSecretButton = username === 'rafa';

    const handlePasswordSuccess = () => {
        setView('programs');
    };

    const handleAddProgram = () => {
        setEditingProgram(null);
        setView('form');
    };

    const handleEditProgram = (index) => {
        setEditingProgram(programs[index]);
        setView('form');
    };

    const handleSaveProgram = (programData) => {
        if (editingProgram) {
            const index = programs.indexOf(editingProgram);
            const updated = [...programs];
            updated[index] = programData;
            setPrograms(updated);
        } else {
            setPrograms([...programs, programData]);
        }
        setView('programs');
    };

    const handleBackToPrograms = () => {
        setView('programs');
    };

    if (view === 'main') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">Bienvenido</h1>
                    <p className="text-gray-600">Usuario: {username}</p>
                </div>
                {showSecretButton && (
                    <SecretButton onClick={() => setView('password')} />
                )}
            </div>
        );
    }

    if (view === 'password') {
        return <PasswordView onSuccess={handlePasswordSuccess} />;
    }

    if (view === 'programs') {
        return (
            <ProgramsView
                programs={programs}
                onAddProgram={handleAddProgram}
                onEditProgram={handleEditProgram}
            />
        );
    }

    if (view === 'form') {
        return (
            <ProgramForm
                program={editingProgram}
                onBack={handleBackToPrograms}
                onSave={handleSaveProgram}
            />
        );
    }

    return null;
}