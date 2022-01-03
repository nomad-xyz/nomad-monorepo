use std::{
    ffi::OsStr,
    fs::File,
    io::Write,
    path::{Path, PathBuf},
};

use ethers::contract::Abigen;

static ABI_DIR: &str = "./abis";
static BINDINGS_DIR: &str = "./src/bindings";

fn main() {
    println!("cargo:rerun-if-changed={}", ABI_DIR);

    clean_old_bindings();

    let mut mod_file = create_mod_rs();

    let mut names: Vec<String> = std::fs::read_dir(ABI_DIR)
        .expect("could not read ABI folder")
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| path.extension().and_then(OsStr::to_str) == Some("json"))
        .map(|contract_path| {
            println!("Generating bindings for {:?}", &contract_path);
            bindgen(&contract_path)
        })
        .collect();

    // generate modfile in happy alphabetical order
    names.sort();

    for name in names.iter() {
        writeln!(mod_file, "pub(crate) mod {};", name).expect("failed to write to modfile");
    }
}

fn create_mod_rs() -> File {
    let mod_file_path = PathBuf::from(&format!("{}/mod.rs", BINDINGS_DIR));
    let mut mod_file = std::fs::File::create(&mod_file_path).expect("could not create modfile");
    writeln!(mod_file, "#![allow(clippy::all)]").unwrap();
    mod_file
}

fn clean_old_bindings() {
    std::fs::remove_dir_all(BINDINGS_DIR).expect("could not delete old bindings");
    std::fs::create_dir_all(BINDINGS_DIR).expect("could not create bindings dir");
}

fn bindgen(contract_path: &Path) -> String {
    println!("path {:?}", contract_path);
    // contract name is the first
    let contract_name = contract_path
        .file_name()
        .and_then(OsStr::to_str)
        .expect("conract filename not valid unicode stop doing dumb stuff.")
        .split('.')
        .next()
        .expect("missing extension in path");

    let module_name = contract_name.to_lowercase();

    let bindings = Abigen::new(
        contract_name,
        contract_path.to_str().expect("valid utf8 path"),
    )
    .expect("could not instantiate Abigen")
    .generate()
    .expect("could not generate bindings");

    bindings
        .write_to_file(format!("./src/bindings/{}.rs", &module_name))
        .expect("could not write bindings to file");

    module_name
}
