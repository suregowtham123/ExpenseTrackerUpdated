using System.Text.Json;
using System.Text.Json.Serialization;

namespace ExpenseTracker.Api.Data;

/// <summary>Thread-safe access to the app's data, persisted in a single JSON file.</summary>
public interface IDataStore
{
    /// <summary>Run a read-only query. The lambda must return copies/DTOs, never the live lists.</summary>
    T Read<T>(Func<DataFile, T> reader);

    /// <summary>Run a change. The file is saved afterwards; if the lambda throws, nothing is saved and the change is undone.</summary>
    T Write<T>(Func<DataFile, T> writer);
}

public sealed class JsonDataStore : IDataStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly string _path;
    private readonly bool _seedDemoData;
    private readonly object _gate = new();
    private DataFile _data;

    public JsonDataStore(string path, bool seedDemoData = true)
    {
        _path = Path.GetFullPath(path);
        _seedDemoData = seedDemoData;
        _data = LoadOrCreate();
    }

    public string FilePath => _path;

    public T Read<T>(Func<DataFile, T> reader)
    {
        lock (_gate)
        {
            return reader(_data);
        }
    }

    public T Write<T>(Func<DataFile, T> writer)
    {
        lock (_gate)
        {
            try
            {
                var result = writer(_data);
                SaveTo(_data);
                return result;
            }
            catch
            {
                // Undo any half-applied change by reloading the last good copy from disk
                _data = LoadOrCreate();
                throw;
            }
        }
    }

    private DataFile LoadOrCreate()
    {
        if (!File.Exists(_path))
        {
            var fresh = SeedData.Create(_seedDemoData);
            SaveTo(fresh);
            return fresh;
        }

        try
        {
            var json = File.ReadAllText(_path);
            return JsonSerializer.Deserialize<DataFile>(json, JsonOptions)
                   ?? throw new InvalidDataException($"The data file '{_path}' is empty.");
        }
        catch (JsonException ex)
        {
            throw new InvalidDataException(
                $"The data file '{_path}' is not valid JSON. Fix it, or delete it to start with fresh data. ({ex.Message})", ex);
        }
    }

    private void SaveTo(DataFile data)
    {
        var directory = Path.GetDirectoryName(_path);
        if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);

        // Write to a temp file first, then swap, so a crash never leaves a half-written data file
        var temp = _path + ".tmp";
        File.WriteAllText(temp, JsonSerializer.Serialize(data, JsonOptions));
        File.Move(temp, _path, overwrite: true);
    }
}
