import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/permiso_trabajo.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const preguntas = [
	{
		categoria: "CONDICIONES DE SEGURIDAD",
		items: [
			"Cuenta con el Equipo de Protección Personal (guantes, casco con barbuquejo, tapaoídos, gafas con filtro UV calzado de seguridad etc.).",
			"Cuenta con el Equipo de Protección Contra Caídas (Arnés de cuerpo completo, arrestador de caídas, mosquetones, eslinga en “Y” con absorbedor, eslinga de posicionamiento, línea de vida (vertical y horizontal), mecanismos de anclaje).",
			"Cuenta con la ropa de dotación ya sea overol, camisa o jean.",
		],
	},
	{
		categoria: "CONTROLES OPERACIONALES PARA LA TORRE GRÚA",
		items: [
			"¿Se ha verificado que toda la tornillería y pasadores de las uniones, estén bien ajustados?",
			"¿Se ha verificado que anillo arriostrador este bien sujeto a la Torre Grúa?",
			"¿Se ha verificado que las soldaduras de el marco y las vigas estén en buen estado?",
			"¿La base de la torre grua se encuentra en buenas condiciones, sin grietas o deformaciones?",
			"¿Se verificó el buen funcionamiento del pito?",
			"¿Se ha verificado el buen estado de los cables de alimentación eléctrica del equipo?",
			"¿Se probó en vacio y con velocidad lenta los movimientos de la máquina, giro, elevación y carro?",
			"¿Se ha verificado el buen estado y el enrollamiento de los cables?",
			"¿Los frenos se encuentran funcionando bien?",
			"¿Se ha verificado el buen estado y funcionamiento de las poleas y el soporte de la polea dinamométrica?",
			"¿Se ha verificado el buen estado del gancho y el seguro?",
			"¿Se ha verificado el buen funcionamiento del punto muerto?",
			"¿El mando se encuentra en buen estado?",
		],
	},
	{
		categoria: "ELEMENTOS Y EQUIPO DE IZAJE DE CARGAS/SEGURIDAD PARA EL APAREJADOR",
		items: [
			"Baldes de Concreto/Escombro/Tierra están en buen estado?",
			"Canasta para materiales está en buen estado?",
			"Se ha verificado que los estrobos (guaya, reata, eslinga, cadena) se encuentran en buen estado?",
			"Los accesorios de extremos (grilletes) se encuentran en buen estado?",
			"Cuenta con ayudante para amarre de cargas?",
			"Cuenta con radio de comunicación",
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
 * ChequeoTorreGruas — lista de verificación pre-operacional de torregrúa para Gruaman.
 * Persiste las respuestas semanalmente en localStorage; las limpia los domingos.
 * Envía mediante POST a /gruaman/chequeo_torregruas al guardar.
 *
 * @param {Object}   props
 * @param {Object}   [props.value={}]   Respuestas pre-cargadas indexadas por número de pregunta.
 * @param {Function} [props.onChange]   Se llama con las respuestas actualizadas en cada cambio.
 */
function ChequeoTorreGruas({ value = {}, onChange }) {
	const [respuestas, setRespuestas] = useState(value);
	const [generales, setGenerales] = useState({
		cliente: "",
		proyecto: "",
		fecha: "",
		operador: "",
		cargo: "",
	});
	const [errores, setErrores] = useState({});
	const guardarBtnRef = useRef(null);
	const navigate = useNavigate();

	useEffect(() => {
		const weekKey = getCurrentWeekKey();
		const saved = localStorage.getItem("chequeo_torregruas_respuestas");
		let shouldClear = false;

		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				if (isSunday() || parsed.weekKey !== weekKey) {
					shouldClear = true;
				} else {
					setRespuestas(parsed.respuestas || {});
					setGenerales(parsed.generales || {
						cliente: "",
						proyecto: "",
						fecha: "",
						operador: "",
						cargo: "",
					});
				}
			} catch {
				shouldClear = true;
			}
		}
		if (shouldClear) {
			localStorage.removeItem("chequeo_torregruas_respuestas");
			setRespuestas({});
			setGenerales({
				cliente: "",
				proyecto: "",
				fecha: "",
				operador: "",
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
					cliente: constructora,
					proyecto: nombre_proyecto,
					operador: nombre_operador,
					fecha: fechaHoy,
					cargo: cargo,
				});
			})
			.catch(() => {
				setGenerales({
					cliente: "",
					proyecto: nombre_proyecto,
					operador: nombre_operador,
					fecha: fechaHoy,
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

	let preguntaIdx = 0;

	const mapRespuestasToPayload = () => {
		return {
			nombre_cliente: generales.cliente,
			nombre_proyecto: generales.proyecto,
			fecha_servicio: generales.fecha,
			nombre_operador: generales.operador,
			cargo: generales.cargo,
			epp_personal: respuestas[0] || "",
			epp_contra_caidas: respuestas[1] || "",
			ropa_dotacion: respuestas[2] || "",
			tornilleria_ajustada: respuestas[3] || "",
			anillo_arriostrador: respuestas[4] || "",
			soldaduras_buen_estado: respuestas[5] || "",
			base_buenas_condiciones: respuestas[6] || "",
			funcionamiento_pito: respuestas[7] || "",
			cables_alimentacion: respuestas[8] || "",
			movimientos_maquina: respuestas[9] || "",
			cables_enrollamiento: respuestas[10] || "",
			frenos_funcionando: respuestas[11] || "",
			poleas_dinamometrica: respuestas[12] || "",
			gancho_seguro: respuestas[13] || "",
			punto_muerto: respuestas[14] || "",
			mando_buen_estado: respuestas[15] || "",
			baldes_buen_estado: respuestas[16] || "",
			canasta_materiales: respuestas[17] || "",
			estrobos_buen_estado: respuestas[18] || "",
			grilletes_buen_estado: respuestas[19] || "",
			ayudante_amarre: respuestas[20] || "",
			radio_comunicacion: respuestas[21] || "",
			observaciones: respuestas.observaciones || "",
		};
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const payload = mapRespuestasToPayload();

		const erroresTemp = {};
		let primerError = null;

		["proyecto", "fecha", "operador", "cargo"].forEach((campo) => {
			if (!generales[campo]) {
				erroresTemp[campo] = true;
				if (!primerError) primerError = campo;
			}
		});

		const totalPreguntas = 22;
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

		try {
					const weekKey = getCurrentWeekKey();
			localStorage.setItem(
				"chequeo_torregruas_respuestas",
				JSON.stringify({
					weekKey,
					respuestas,
					generales,
				})
			);
		
			await axios.post(`${API_BASE_URL}/gruaman/chequeo_torregruas`, payload);
			alert("Lista de chequeo enviada correctamente.");
			if (onChange) onChange({});
			setRespuestas({});
			navigate(-1);
		} catch (err) {
			alert("Error al enviar la lista de chequeo.");
		}
	};

	return (
		<form className="form-container" onSubmit={handleSubmit}>
			<div className="card-section" style={{ marginBottom: 16 }}>
				<h3 className="card-title" style={{ marginBottom: 12 }}>
					Datos Generales
				</h3>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
					{[
						{ name: "cliente", label: "Cliente / Constructora", readOnly: true },
						{ name: "proyecto", label: "Proyecto / Constructora", readOnly: true },
						{ name: "fecha", label: "Fecha", type: "date", readOnly: true },
						{ name: "operador", label: "Trabajador autorizado", readOnly: true },
						{ name: "cargo", label: "Cargo", readOnly: false },
					].map((item) => (
						<div key={item.name} style={{ flex: 1, minWidth: 180 }}>
							<label className="label">{item.label}</label>
							<input
								id={`campo_${item.name}`}
								name={item.name}
								placeholder={item.label}
								type={item.type || "text"}
								value={generales[item.name]}
								readOnly={item.readOnly}
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
			{preguntas.map((bloque, i) => (
				<div
					className="card-section"
					key={i}
					style={{
						marginBottom: 0.5,
						paddingBottom: 0.5,
						borderBottom: i < preguntas.length - 1 ? "1px solid #e0e0e0" : "none",
					}}
				>
					<h4 className="card-title" style={{ marginBottom: 14 }}>
						{bloque.categoria}
					</h4>
					<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
						{bloque.items.map((pregunta, j) => {
							const idx = preguntaIdx++;
							return (
								<div key={idx} style={{ marginBottom: 4 }}>
									<div
										className="permiso-trabajo-label"
										style={{ marginBottom: 4 }}
									>
										{pregunta}
									</div>
									<div style={{ display: "flex", alignItems: "center" }}>
										<select
											id={`pregunta_${idx}`}
											name={`pregunta_${idx}`}
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
				</div>
			))}
			<div className="card-section">
				<label className="permiso-trabajo-label" htmlFor="observaciones">
					OBSERVACIONES
				</label>
				<div style={{ width: "100%", display: "flex" }}>
					<textarea
						id="observaciones"
						className="permiso-trabajo-textarea"
						style={{
							width: "100%",
							minHeight: 60,
							resize: "vertical",
							boxSizing: "border-box",
							marginLeft: 0,
							marginRight: 0,
						}}
						value={respuestas.observaciones || ""}
						onChange={(e) => {
							const nuevas = { ...respuestas, observaciones: e.target.value };
							setRespuestas(nuevas);
							if (onChange) onChange(nuevas);
						}}
					/>
				</div>
			</div>
			<div className="card-section">
				<label className="permiso-trabajo-label">
					FIRMA TRABAJADOR AUTORIZADO / CONSTANCIA DE VERIFICACION DIARIA DE LAS
					CONDICIONES SEGURAS PARA EL TA
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
					style={{
						background: "#ff9800",
						color: "#fff"
					}}
					ref={guardarBtnRef}
				>
					Guardar
				</button>
			</div>
		</form>
	);
}

export default ChequeoTorreGruas;
