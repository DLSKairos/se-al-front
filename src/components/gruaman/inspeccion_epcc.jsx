import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/permiso_trabajo.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const preguntas = [
	{
		categoria: "ARNÉS",
		items: [
			"¿Cuenta con: Etiquetas, Cintas, Correas, Costuras, Partes Metálicas, Partes Plásticas en buen estado?",
		],
	},
	{
		categoria: "ARRESTADOR DE CAÍDAS",
		items: [
			"¿Presenta: Desgaste Excesivo, Picaduras, Grietas, Seguros y Partes Móviles, Corrosión en partes metálicas, Deformaciones (Dobladuras), Presencia de Moho, Resortes (Detectar fallas), Freno (hacer prueba)?",
		],
	},
	{
		categoria: "MOSQUETÓN",
		items: [
			"¿Presenta: Desgaste Excesivo, Picaduras, Grietas, Seguros y Partes Móviles, Corrosión en partes metálicas, Deformaciones (Dobladuras, etc), Bloqueo (ajuste excesivo) de los mosquetones en cierres de seguridad, Grietas o picaduras, Deterioro General, Ajuste seguro?",
		],
	},
	{
		categoria: "ESLINGA DE POSICIONAMIENTO",
		items: [
			"¿Cuenta con: Cintas, Correas, Cuerdas y Partes Metálicas en buen estado?",
		],
	},
	{
		categoria: "ESLINGA EN 'Y' CON ABSORBEDOR",
		items: [
			"¿Cuenta con: Etiquetas, Absorbedor de Caída, Cintas, Correas, Costuras, Partes Metálicas, Partes Plásticas en buen estado?",
		],
	},
	{
		categoria: "LÍNEA DE VIDA",
		items: [
			"¿Cuenta Con: Etiquetas, Partes Metálicas, Partes Plásticas, Cintas, Cuerdas en buen estado?",
		],
	},
];

function getCurrentWeekKey() {
	const now = new Date();
	const firstJan = new Date(now.getFullYear(), 0, 1);
	const days = Math.floor((now - firstJan) / (24 * 60 * 60 * 1000));
	const week = Math.ceil((days + firstJan.getDay() + 1) / 7);
	return `${now.getFullYear()}-W${week}`;
}
function isSunday() {
	return new Date().getDay() === 0;
}

/**
 * InspeccionEPCC — formulario semanal de inspección EPCC (equipos de protección contra caídas) para Gruaman.
 * Cubre condiciones de salud, EPP, EPCC, herramientas manuales y herramientas mecanizadas.
 * Persiste las respuestas semanalmente en localStorage; las limpia los domingos.
 * Envía mediante POST a /gruaman/inspeccion_epcc al guardar.
 *
 * @param {Object}   props
 * @param {Object}   [props.value={}]   Respuestas pre-cargadas.
 * @param {Function} [props.onChange]   Se llama con las respuestas actualizadas en cada cambio.
 */
function InspeccionEPCC({ value = {}, onChange }) {
	const [respuestas, setRespuestas] = useState(value);
	const [generales, setGenerales] = useState({
		nombre_cliente: "",
		nombre_proyecto: "",
		fecha_servicio: "",
		nombre_operador: "",
		cargo: "",
	});
	const [errores, setErrores] = useState({});
	const guardarBtnRef = useRef(null);

	const navigate = useNavigate();

	useEffect(() => {
		const weekKey = getCurrentWeekKey();
		const saved = localStorage.getItem("inspeccion_epcc_respuestas");
		let shouldClear = false;

		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				if (isSunday() || parsed.weekKey !== weekKey) {
					shouldClear = true;
				} else {
					setRespuestas(parsed.respuestas || {});
					setGenerales(parsed.generales || {
						nombre_cliente: "",
						nombre_proyecto: "",
						fecha_servicio: "",
						nombre_operador: "",
						cargo: "",
					});
				}
			} catch {
				shouldClear = true;
			}
		}
		if (shouldClear) {
			localStorage.removeItem("inspeccion_epcc_respuestas");
			setRespuestas({});
			setGenerales({
				nombre_cliente: "",
				nombre_proyecto: "",
				fecha_servicio: "",
				nombre_operador: "",
				cargo: "",
			});
		}
	}, []);

	useEffect(() => {
		const nombre_proyecto = localStorage.getItem("obra") || localStorage.getItem("nombre_proyecto") || "";
		const nombre_operador = localStorage.getItem("nombre_trabajador") || "";
		const fechaHoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
		const cargo = localStorage.getItem("cargo_trabajador") || "";

		axios.get(`${API_BASE_URL}/obras`)
			.then(res => {
				let obras = [];
				if (Array.isArray(res.data.obras)) {
					obras = res.data.obras;
				}
				const obra_seleccionada = obras.find(o => o.nombre_obra === nombre_proyecto);
				const constructora = obra_seleccionada ? obra_seleccionada.constructora : "";
				setGenerales({
					nombre_cliente: constructora,
					nombre_proyecto: nombre_proyecto,
					nombre_operador: nombre_operador,
					fecha_servicio: fechaHoy,
					cargo: cargo,
				});
			})
			.catch(() => {
				setGenerales({
					nombre_cliente: "",
					nombre_proyecto: nombre_proyecto,
					nombre_operador: nombre_operador,
					fecha_servicio: fechaHoy,
					cargo: cargo,
				});
			});
	}, []);

	const handleRespuesta = (idx, val) => {
		const nuevas = { ...respuestas, [idx]: val };
		setRespuestas(nuevas);
		if (onChange) onChange(nuevas);
		setErrores((prev) => ({ ...prev, [idx]: false }));
	};

	const handleGeneralesChange = (e) => {
		setGenerales(prev => ({ ...prev, [e.target.name]: e.target.value }));
		setErrores((prev) => ({ ...prev, [e.target.name]: false }));
	};

	let preguntaIdx = 0;

	const scrollToItem = (id) => {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
			el.focus?.();
		}
	};

	const scrollToGuardar = () => {
		if (guardarBtnRef.current) {
			guardarBtnRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
			guardarBtnRef.current.focus?.();
		}
	};

	const mapRespuestasToPayload = () => {
		return {
			// Datos generales
			nombre_cliente: generales.nombre_cliente,
			nombre_proyecto: generales.nombre_proyecto,
			fecha_servicio: generales.fecha_servicio,
			nombre_operador: generales.nombre_operador,
			cargo: generales.cargo,

			// Seriales y lotes
			serial_arnes: respuestas.serial_arnes || "",
			serial_arrestador: respuestas.serial_arrestador || "",
			serial_mosqueton: respuestas.serial_mosqueton || "",
			serial_posicionamiento: respuestas.serial_posicionamiento || "",
			serial_eslinga_y: respuestas.serial_eslinga_y || "",
			serial_linea_vida: respuestas.serial_linea_vida || "",

			// Resultados de inspección
			arnes: respuestas[0] || "",
			arrestador_caidas: respuestas[1] || "",
			mosqueton: respuestas[2] || "",
			eslinga_posicionamiento: respuestas[3] || "",
			eslinga_y_absorbedor: respuestas[4] || "",
			linea_vida: respuestas[5] || "",

			// Observaciones
			observaciones: respuestas.observaciones || "",
		};
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const payload = mapRespuestasToPayload();

		const erroresTemp = {};
		let primerError = null;

		[
			"nombre_proyecto",
			"fecha_servicio",
			"nombre_operador",
			"cargo"
		].forEach((campo) => {
			if (!payload[campo]) {
				erroresTemp[campo] = true;
				if (!primerError) primerError = campo;
			}
		});

		const totalPreguntas = 6;
		for (let i = 0; i < totalPreguntas; i++) {
			if (!respuestas[i] || !["SI", "NO", "NA"].includes(respuestas[i])) {
				erroresTemp[i] = true;
				if (!primerError) primerError = `pregunta_${i}`;
			}
		}

		setErrores(erroresTemp);

		if (primerError) {
			if (typeof primerError === "string" && primerError.startsWith("pregunta_")) {
				const idx = Number(primerError.split("_")[1]);
				scrollToItem(`pregunta_${idx}`);
			} else {
				scrollToItem(`campo_${primerError}`);
			}
			return;
		}

			const weekKey = getCurrentWeekKey();
		localStorage.setItem(
			"inspeccion_epcc_respuestas",
			JSON.stringify({
				weekKey,
				respuestas,
				generales,
			})
		);
	
		try {
			await axios.post(`${API_BASE_URL}/gruaman/inspeccion_epcc`, payload);
			alert("Lista de inspección enviada correctamente.");
			if (onChange) onChange({});
			setRespuestas({});
			navigate(-1);
		} catch (err) {
			alert("Error al enviar la lista de chequeo.");
		}
	};

	return (
		<form className="form-container" onSubmit={handleSubmit}>
			{/* Datos Generales */}
			<div className="card-section" style={{ marginBottom: 16 }}>
				<h3 className="card-title" style={{ marginBottom: 12 }}>
					Datos Generales
				</h3>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
					{[
						{ name: "nombre_cliente", label: "Cliente / Constructora" },
						{ name: "nombre_proyecto", label: "Proyecto / Constructora" },
						{ name: "fecha_servicio", label: "Fecha", type: "date" },
						{ name: "nombre_operador", label: "Trabajador autorizado" },
						{ name: "cargo", label: "Cargo" },
					].map((item) => (
						<div key={item.name} style={{ flex: 1, minWidth: 180 }}>
							<label className="label">{item.label}</label>
							<input
								id={`campo_${item.name}`}
								type={item.type || "text"}
								name={item.name}
								value={generales[item.name]}
								readOnly={item.name !== "cargo"}
								onChange={handleGeneralesChange}
								className={`permiso-trabajo-input${errores[item.name] ? " campo-error" : ""}`}
								style={errores[item.name] ? { borderColor: "red", background: "#ffeaea" } : {}}
							/>
							{errores[item.name] && (
								<span style={{ color: "red", fontSize: 13 }}>
									Este campo es obligatorio.
									<span
										style={{
											marginLeft: 8,
											cursor: "pointer",
											fontSize: 18,
											verticalAlign: "middle"
										}}
										onClick={scrollToGuardar}
										title="Ir al botón Guardar"
									>
										&#8594;
									</span>
								</span>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Seriales y lotes */}
			<div className="card-section" style={{ marginBottom: 16 }}>
				<h3 className="card-title" style={{ marginBottom: 12 }}>
					Equipos de Protección Contra Caídas - Serial y Lote
				</h3>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
					{[
						{ name: "serial_arnes", label: "Serial y Lote Arnés" },
						{ name: "serial_arrestador", label: "Serial y Lote Arrestador de Caídas" },
						{ name: "serial_mosqueton", label: "Serial y Lote Mosquetón" },
						{ name: "serial_posicionamiento", label: "Serial y Lote Eslinga de Posicionamiento" },
						{ name: "serial_eslinga_y", label: 'Serial y Lote Eslinga en "Y" con Absorbedor' },
						{ name: "serial_linea_vida", label: "Serial y Lote Línea de Vida" },
					].map((item) => (
						<div key={item.name} style={{ flex: 1, minWidth: 180 }}>
							<label className="label">{item.label}</label>
							<input
								name={item.name}
								placeholder={item.label}
								value={respuestas[item.name] || ""}
								onChange={(e) => {
									const nuevas = { ...respuestas, [item.name]: e.target.value };
									setRespuestas(nuevas);
									if (onChange) onChange(nuevas);
								}}
								className="permiso-trabajo-input"
							/>
						</div>
					))}
				</div>
			</div>

			{/* Preguntas */}
			{preguntas.map((bloque, i) => (
				<div className="card-section" key={i}>
					<h4 className="card-title">{bloque.categoria}</h4>
					{bloque.items.map((pregunta, j) => {
						const idx = preguntaIdx++;
						return (
							<div key={idx} style={{ marginBottom: 8 }}>
								<div className="permiso-trabajo-label">{pregunta}</div>
								<div style={{ display: "flex", alignItems: "center" }}>
									<select
										id={`pregunta_${idx}`}
										value={respuestas[idx] || ""}
										onChange={(e) => handleRespuesta(idx, e.target.value)}
										className={`permiso-trabajo-select${errores[idx] ? " campo-error" : ""}`}
										style={errores[idx] ? { borderColor: "red", background: "#ffeaea", minWidth: 120, maxWidth: 220 } : { minWidth: 120, maxWidth: 220 }}
									>
										<option value="">--</option>
										<option value="SI">SI</option>
										<option value="NO">NO</option>
										<option value="NA">NA</option>
									</select>
									{errores[idx] && (
										<span
											style={{
												color: "red",
												fontSize: 16,
												marginLeft: 8,
												cursor: "pointer",
												verticalAlign: "middle"
											}}
											onClick={scrollToGuardar}
											title="Ir al botón Guardar"
										>
											&#8594;
										</span>
									)}
								</div>
							</div>
						);
					})}
				</div>
			))}

			{/* Observaciones */}
			<div className="card-section">
				<label className="permiso-trabajo-label">OBSERVACIONES</label>
				<textarea
					className="permiso-trabajo-textarea"
					style={{ width: "93%", minHeight: 60 }}
					value={respuestas.observaciones || ""}
					onChange={(e) => {
						const nuevas = { ...respuestas, observaciones: e.target.value };
						setRespuestas(nuevas);
						if (onChange) onChange(nuevas);
					}}
				/>
			</div>

			{/* Firma */}
			<div className="card-section">
				<label className="permiso-trabajo-label">
					FIRMA TRABAJADOR AUTORIZADO / CONSTANCIA DE VERIFICACIÓN
				</label>
				<input
					type="text"
					className="permiso-trabajo-input"
					placeholder="Nombre y/o firma"
					value={respuestas.firma || ""}
					onChange={(e) => {
						const nuevas = { ...respuestas, firma: e.target.value };
						setRespuestas(nuevas);
						if (onChange) onChange(nuevas);
					}}
				/>
			</div>

			<div style={{ textAlign: "right", marginTop: 24 }}>
				<button
					type="submit"
					className="button"
					style={{ background: "#ff9800", color: "#fff" }}
					ref={guardarBtnRef}
				>
					Guardar
				</button>
			</div>
		</form>
	);
}

export default InspeccionEPCC;
