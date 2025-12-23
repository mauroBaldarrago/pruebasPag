<?php
header("Content-Type: application/json");

// ================= CONFIGURACIÓN REAL PARA RAILWAY =================
// getenv() leerá automáticamente las variables de tu panel de Railway
$host = getenv('MYSQLHOST') ?: "mysql.railway.internal"; 
$user = getenv('MYSQLUSER') ?: "root";
$pass = getenv('MYSQLPASSWORD') ?: "DqutakVFwFugWYWJxOPNlHONyhifAIMt";
$db   = getenv('MYSQLDATABASE') ?: "railway";
$port = getenv('MYSQLPORT') ?: "3306";

try {
    // Añadimos el puerto a la cadena de conexión
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8";
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(["error" => "Error de conexión: " . $e->getMessage()]));
}

// ================= ACCIONES =================
$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch($action) {
    // ---------------- REGISTRAR USUARIO ----------------
    case "addUsuario":
        $data = json_decode(file_get_contents("php://input"), true);
        $nombre = $data['nombre'] ?? '';
        $correo = $data['correo'] ?? '';
        $clave = $data['clave'] ?? '';
        $plan = $data['plan'] ?? 'normal';

        // Verificar si ya existe
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE correo = ?");
        $stmt->execute([$correo]);
        if($stmt->rowCount() > 0) {
            echo json_encode(["ok" => false, "msg" => "Correo ya registrado"]);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO usuarios (usuario, correo, clave, plan) VALUES (?, ?, ?, ?)");
        $ok = $stmt->execute([$nombre, $correo, $clave, $plan]);
        echo json_encode(["ok" => $ok]);
        break;

    // ---------------- LOGIN ----------------
    case "login":
        $data = json_decode(file_get_contents("php://input"), true);
        $correo = $data['correo'] ?? '';
        $clave = $data['clave'] ?? '';

        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE correo = ? AND clave = ?");
        $stmt->execute([$correo, $clave]);
        echo json_encode(["ok" => $stmt->rowCount() > 0]);
        break;

    // ---------------- OBTENER USUARIO ----------------
    case "getUsuario":
        $correo = $_GET['correo'] ?? '';
        $stmt = $pdo->prepare("SELECT usuario, plan FROM usuarios WHERE correo = ?");
        $stmt->execute([$correo]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($usuario ?: []);
        break;

    // ---------------- AGREGAR NOTA ----------------
    case "addNota":
        $data = json_decode(file_get_contents("php://input"), true);
        $correo = $data['correo'] ?? '';
        $texto = $data['texto'] ?? '';
        $tipo = $data['tipo'] ?? 'texto';
        $fecha = $data['fecha'] ?? date('d/m/Y');
        $fechaRecordatorio = $data['fechaRecordatorio'] ?? '';
        $completada = $data['completada'] ?? 0;
        $color = $data['color'] ?? 'black';

        $stmt = $pdo->prepare("INSERT INTO notas (correo, texto, tipo, fecha, fechaRecordatorio, completada, color) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $ok = $stmt->execute([$correo, $texto, $tipo, $fecha, $fechaRecordatorio, $completada, $color]);
        echo json_encode(["ok" => $ok]);
        break;

    // ---------------- OBTENER NOTAS ----------------
    case "getNotas":
        $correo = $_GET['correo'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM notas WHERE correo = ?");
        $stmt->execute([$correo]);
        $notas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($notas);
        break;

    // ---------------- ELIMINAR NOTA ----------------
    case "deleteNota":
        $id = $_GET['id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM notas WHERE id = ?");
        $ok = $stmt->execute([$id]);
        echo json_encode(["ok" => $ok]);
        break;

    // ---------------- ACTIVAR PREMIUM ----------------
    case "activarPremium":
        $correo = $_GET['correo'] ?? '';
        $stmt = $pdo->prepare("UPDATE usuarios SET plan='premium' WHERE correo=?");
        $ok = $stmt->execute([$correo]);
        echo json_encode(["ok" => $ok]);
        break;

    default:
        echo json_encode(["error" => "Acción no válida"]);
        break;
}
?>
